package com.auth0.androidlogin

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import classes.AvatarAdapter
import com.auth0.androidlogin.databinding.ActivitySetAvatarBinding
import com.auth0.androidlogin.models.Avatar
import com.services.AccountService
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SetAvatarActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySetAvatarBinding
    private lateinit var avatarAdapter: AvatarAdapter
    private var selectedAvatar: Avatar? = null
    private lateinit var accountService: AccountService
    private var photoURI: Uri? = null
    private var isCustomAvatarSelected: Boolean = false

    companion object {
        private const val CAMERA_PERMISSION_REQUEST_CODE = 1001
    }

    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success && photoURI != null) {
            lifecycleScope.launch {
                handleImageUri(photoURI!!)
            }
        } else {
            Toast.makeText(this, getString(R.string.cancelled_or_failed), Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetAvatarBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize AccountService
        accountService = AccountService(this)

        // Retrieve userId from Intent extras
        val userId = intent.getStringExtra("USER_ID")

        // Define your predefined avatars
        val avatars = listOf(
            Avatar(1, R.drawable.m1, "m1.png"),
            Avatar(2, R.drawable.m2, "m2.png"),
            Avatar(3, R.drawable.m3, "m3.png"),
            Avatar(4, R.drawable.w1, "w1.jpg")
            // Add more avatars as needed
        )

        // Initialize Adapter
        avatarAdapter = AvatarAdapter(avatars) { avatar ->
            selectedAvatar = avatar
        }

        // Set up RecyclerView
        binding.avatarRecyclerView.apply {
            layoutManager = GridLayoutManager(this@SetAvatarActivity, 2) // 2 columns
            adapter = avatarAdapter
        }

        val profilePictureButton = findViewById<ImageButton>(R.id.profilePictureButton)
        profilePictureButton.setOnClickListener {
            captureImageFromCamera()
        }

        binding.submitAvatarButton.setOnClickListener {
            val avatarUrl = selectedAvatar?.imageUrl
            val customAvatarBase64 = AuthUtils.getUserProfilePictureBase64(this@SetAvatarActivity)

            if (avatarUrl != null) {
                submitAvatar(avatarUrl, isCustom = false, userId)
            } else if (!customAvatarBase64.isNullOrEmpty()) {
                submitAvatar(customAvatarBase64, isCustom = true, userId)
            } else {
                Toast.makeText(this, R.string.select_avatar, Toast.LENGTH_SHORT).show()
            }
        }

    }
    private fun submitAvatar(avatarData: String, isCustom: Boolean, userId: String?) {
        lifecycleScope.launch {
            val success = accountService.updateAvatar(avatarData)
            if (success) {
                val intent = Intent(this@SetAvatarActivity, HomeActivity::class.java).apply {
                    putExtra("USER_NAME", AuthUtils.getUserName(this@SetAvatarActivity))
                    putExtra("USER_PROFILE_PICTURE", avatarData)
                    putExtra("USER_ID", userId)
                }
                startActivity(intent)
                finish()
            } else {
                if (isCustom) {
                    Toast.makeText(this@SetAvatarActivity, R.string.failedAvatar, Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this@SetAvatarActivity, R.string.failedAvatar, Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun captureImageFromCamera() {
        // Vérifier les permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE),
                CAMERA_PERMISSION_REQUEST_CODE
            )
        } else {
            dispatchTakePictureIntent()
        }
    }

    private fun dispatchTakePictureIntent() {
        // Créer un fichier temporaire pour stocker la photo
        val photoFile: File? = try {
            createImageFile()
        } catch (ex: IOException) {
            // Erreur lors de la création du fichier
            Log.e("SettingsActivity", "Error creating image file", ex)
            null
        }
        // Continuer uniquement si le fichier a été créé avec succès
        photoFile?.also {
            photoURI = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                it
            )
            takePictureLauncher.launch(photoURI!!)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            CAMERA_PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // Permission granted
                    dispatchTakePictureIntent()
                } else {
                    // Permission denied
                    Toast.makeText(this, getString(R.string.camera_perm), Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun createImageFile(): File {
        // Create an image file name with timestamp
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir: File = getExternalFilesDir(Environment.DIRECTORY_PICTURES)!!
        return File.createTempFile(
            "JPEG_${timeStamp}_",
            ".jpg",
            storageDir
        )
    }

    private suspend fun handleImageUri(uri: Uri) {
        try {
            // Charger le bitmap à partir de l'URI
            val bitmap = withContext(Dispatchers.IO) {
                val inputStream = contentResolver.openInputStream(uri)
                BitmapFactory.decodeStream(inputStream)
            }

            val rotatedBitmap = withContext(Dispatchers.IO) {
                rotateBitmapIfRequired(bitmap, uri)
            }

            // Redimensionner le bitmap si nécessaire
            val resizedBitmap = resizeBitmap(rotatedBitmap, 500, 500)

            // Convertir le bitmap en base64
            val base64Image = bitmapToBase64(resizedBitmap)

            // Mettre à jour l'avatar localement
            withContext(Dispatchers.Main) {
                setProfilePicture(base64Image)
                // Stocker le base64 dans SharedPreferences
                AuthUtils.storeUserProfilePicture(this@SetAvatarActivity, base64Image)
            }

            val success = accountService.updateAvatar(base64Image)
            if (success) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@SetAvatarActivity,
                        getString(R.string.success_upload),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } else {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@SetAvatarActivity,
                        getString(R.string.failed_upload),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        } catch (e: Exception) {
            Log.e("SettingsActivity", "Erreur lors du traitement de l'image: ${e.message}", e)
            withContext(Dispatchers.Main) {
                Toast.makeText(this@SetAvatarActivity, getString(R.string.failed_upload), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setProfilePicture(imageResId: Int?) {
        val profilePictureButton = findViewById<ImageButton>(R.id.profilePictureButton)
        if (imageResId != null && imageResId != 0)  {
            Glide.with(this)
                .load(imageResId)
                .apply(RequestOptions.circleCropTransform())
                .placeholder(R.drawable.image_not_found)
                .error(R.drawable.image_not_found)
                .into(profilePictureButton)
        } else {
            Glide.with(this)
                .load(R.drawable.image_not_found)
                .apply(RequestOptions.circleCropTransform())
                .into(profilePictureButton)
        }
    }

    private fun setProfilePicture(base64Image: String) {
        val profilePictureButton = findViewById<ImageButton>(R.id.profilePictureButton)
        if (base64Image.isNotEmpty()) {
            val base64String = if (base64Image.startsWith("data:image")) {
                base64Image.substringAfter(",")
            } else {
                base64Image
            }
            val decodedBytes = android.util.Base64.decode(base64String, android.util.Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            Glide.with(this)
                .load(bitmap)
                .apply(
                    RequestOptions.circleCropTransform()
                        .placeholder(R.drawable.image_not_found)
                        .error(R.drawable.image_not_found)
                )
                .into(profilePictureButton)
            Log.d("SettingsActivity", "Set profile picture from base64.")
        } else {
            Glide.with(this)
                .load(R.drawable.image_not_found)
                .apply(RequestOptions.circleCropTransform())
                .into(profilePictureButton)
            Log.d("SettingsActivity", "Set profile picture to default image.")
        }
    }
    private fun rotateBitmapIfRequired(bitmap: Bitmap, uri: Uri): Bitmap {
        val inputStream = contentResolver.openInputStream(uri) ?: return bitmap
        val exif = ExifInterface(inputStream)
        val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        return when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> rotateBitmap(bitmap, 90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> rotateBitmap(bitmap, 180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> rotateBitmap(bitmap, 270f)
            else -> bitmap
        }
    }

    private fun rotateBitmap(bitmap: Bitmap, degrees: Float): Bitmap {
        val matrix = android.graphics.Matrix()
        matrix.postRotate(degrees)
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun resizeBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height

        val ratioBitmap = width.toFloat() / height.toFloat()
        val ratioMax = maxWidth.toFloat() / maxHeight.toFloat()

        var finalWidth = maxWidth
        var finalHeight = maxHeight

        if (ratioMax > ratioBitmap) {
            finalWidth = (maxHeight.toFloat() * ratioBitmap).toInt()
        } else {
            finalHeight = (maxWidth.toFloat() / ratioBitmap).toInt()
        }

        return Bitmap.createScaledBitmap(bitmap, finalWidth, finalHeight, true)
    }
    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
        val byteArray = outputStream.toByteArray()
        return "data:image/jpeg;base64," + android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)    }

}
