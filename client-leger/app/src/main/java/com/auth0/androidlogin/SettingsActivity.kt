package com.auth0.androidlogin

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.provider.MediaStore
import java.io.ByteArrayOutputStream
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import androidx.lifecycle.lifecycleScope
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.widget.AdapterView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import android.widget.CompoundButton
import android.widget.ImageButton
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.app.ActivityCompat
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import androidx.recyclerview.widget.GridLayoutManager
import classes.AvatarAdapter
import com.auth0.androidlogin.databinding.ActivitySettingsBinding
import com.auth0.androidlogin.models.Avatar
import com.auth0.androidlogin.models.LanguageOption
import com.auth0.androidlogin.models.ThemeOption
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.services.AccountService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executor

class SettingsActivity : BaseActivity(), AccountService.UsernameUpdateListener {

    private lateinit var binding: ActivitySettingsBinding
    private var currentUserId: String? = null
    private var currentTheme: String? = null
    private var currentLanguage: String? = null
    private lateinit var accountService: AccountService
    private lateinit var avatarAdapter: AvatarAdapter
    private var photoURI: Uri? = null
    private var ownedThemes: List<String> = listOf()
    private var defaultThemes: List<String> = listOf()
    private var ownedAvatars: List<String> = listOf()
    private var themeChanged: Boolean = false
    private var langChanged: Boolean = false
    private lateinit var usernameTextView: TextView
    private lateinit var editUsernameButton: ImageButton

    companion object {
        private const val CAMERA_PERMISSION_REQUEST_CODE = 1001
        private const val STATE_THEME_CHANGED = "STATE_THEME_CHANGED"
        private const val STATE_LANG_CHANGED = "STATE_LANG_CHANGED"
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
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        currentUserId = intent.getStringExtra("USER_ID") ?: ""

        // Retrieve user ID and access token from AuthUtils
        currentUserId = AuthUtils.getUserId(this)
        val accessToken = AuthUtils.getAccessToken(this)
        currentLanguage = AuthUtils.getUserLanguage(this)

        Log.d("SettingsActivity", "User ID: $currentUserId")

        accountService = AccountService(this)

        if (savedInstanceState != null) {
            themeChanged = savedInstanceState.getBoolean(STATE_THEME_CHANGED, false)
            Log.d("SettingsActivity", "Restored THEME_CHANGED: $themeChanged")

            langChanged = savedInstanceState.getBoolean(STATE_LANG_CHANGED, false)
            Log.d("SettingsActivity", "Restored LANG_CHANGED: $langChanged")
        }

        usernameTextView = findViewById(R.id.usernameTextView)
        editUsernameButton = findViewById(R.id.editUsernameButton)

        editUsernameButton.setOnClickListener {
            onEditUsernameClick()
        }

        lifecycleScope.launch(Dispatchers.IO) {
            currentTheme = AuthUtils.getTheme(this@SettingsActivity)
            currentLanguage = AuthUtils.getUserLanguage(this@SettingsActivity)
            ownedThemes = getOwnedThemesFromServer() ?: listOf()
            Log.d("SettingsActivity", "Owned Themes: $ownedThemes")
            defaultThemes = listOf("light", "dark")
            ownedAvatars = getOwnedAvatarsFromServer() ?: listOf()
            fetchAndLoadCurrentAvatar()
            withContext(Dispatchers.Main) {
                setupSpinners()
                setupAvatarRecyclerView()
                loadUsername()
            }
        }

        val closeButton = findViewById<ImageButton>(R.id.closeButton)
        closeButton?.setOnClickListener {
            finishWithResult()
        }

        val profilePictureButton = findViewById<ImageButton>(R.id.profilePictureButton)
        profilePictureButton.setOnClickListener {
            captureImageFromCamera()
        }
    }

    private suspend fun loadUsername() {
        try {
            val username = AuthUtils.getUserName(this)
            withContext(Dispatchers.Main) {
                if (!username.isNullOrEmpty()) {
                    usernameTextView.text = username
                } else {
                    val fetchedUsername = accountService.getAccount()?.pseudonym
                    usernameTextView.text = fetchedUsername
                }
            }
        } catch (e: Exception) {
            Log.e("SettingsActivity", "Failed to load username: ${e.message}", e)
            withContext(Dispatchers.Main) {
                usernameTextView.text = "User Name"
            }
        }
    }

    fun onEditUsernameClick() {
        accountService.showEditUsernameDialog(this)
    }

    override fun onUsernameUpdated(newUsername: String) {
        setWelcomeText(newUsername)
        Log.d("SettingsActivity", "NEW USER NAME --- $newUsername")
    }

    override fun onUsernameUpdateFailed(errorMessage: String) {
        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
    }

    fun setWelcomeText(userName: String) {
        usernameTextView.text = userName
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putBoolean(STATE_THEME_CHANGED, themeChanged)
        Log.d("SettingsActivity", "Saved THEME_CHANGED: $themeChanged")

        super.onSaveInstanceState(outState)
        outState.putBoolean(STATE_LANG_CHANGED, langChanged)
        Log.d("SettingsActivity", "Saved LANG_CHANGED: $langChanged")
    }


    private fun finishWithResult() {
        val resultIntent = Intent().apply {
            putExtra("THEME_CHANGED", themeChanged)
            Log.d("SettingsActivity", "THEME_CHANGED is $themeChanged" )
            putExtra("LANG_CHANGED", langChanged)
            Log.d("SettingsActivity", "LANG_CHANGED is $langChanged" )
        }
        setResult(RESULT_OK, resultIntent)
        finish()
    }

    override fun onBackPressed() {
        finishWithResult()
        super.onBackPressed()
    }


    private suspend fun getOwnedThemesFromServer(): List<String>? {
        return accountService.getOwnedThemes()
    }

    private suspend fun getOwnedAvatarsFromServer(): List<String>? {
        return accountService.getOwnedAvatars()
    }

    private fun loadProfileImage() {
        lifecycleScope.launch(Dispatchers.IO) {
            val avatarUrl = accountService.getProfilePicture()
            Log.d("SettingsActivity", "Fetched avatarUrl from server: $avatarUrl")
            if (!avatarUrl.isNullOrEmpty()) {
                // Map imageUrl to imageResId
                val imageResId = accountService.getResourceIdFromImageUrl(avatarUrl)
                withContext(Dispatchers.Main) {
                    setProfilePicture(imageResId)
                    // Store both imageResId and imageUrl
                    AuthUtils.storeUserProfilePicture(this@SettingsActivity, imageResId, avatarUrl)
                }
            } else {
                Log.d("SettingsActivity", "No avatar URL found on server.")
                withContext(Dispatchers.Main) {
                    setProfilePicture(R.drawable.image_not_found)
                    AuthUtils.storeUserProfilePicture(this@SettingsActivity, R.drawable.image_not_found, "")
                }
            }
        }
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
                AuthUtils.storeUserProfilePicture(this@SettingsActivity, base64Image)
            }

            // Envoyer l'avatar au serveur
            val success = accountService.updateAvatar(base64Image)
            if (success) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@SettingsActivity,
                        getString(R.string.success_upload),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } else {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@SettingsActivity,
                        getString(R.string.failed_upload),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        } catch (e: Exception) {
            Log.e("SettingsActivity", "Erreur lors du traitement de l'image: ${e.message}", e)
            withContext(Dispatchers.Main) {
                Toast.makeText(this@SettingsActivity, getString(R.string.failed_upload), Toast.LENGTH_SHORT).show()
            }
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


    private suspend fun getUserLanguageFromServer(): String {
        val accessToken = AuthUtils.getAccessToken(this)
        return if (accessToken != null) {
            accountService.getAccountLanguage() ?: "fr"
        } else {
            Log.e("SettingsActivity", "Access token not found while fetching language.")
            "fr"
        }
    }

    private suspend fun patchThemeToServer(selectedTheme: String) {
        val accessToken = AuthUtils.getAccessToken(this)

        if (accessToken != null) {
            accountService.updateTheme(selectedTheme)
        } else {
            Log.e("SettingsActivity", "Access token not found")
        }
    }

    private suspend fun patchLanguageToServer(selectedLanguage: String) {
        val accessToken = AuthUtils.getAccessToken(this)
        if (accessToken != null) {
            accountService.updateLanguage(selectedLanguage)
        }
    }

    private fun setupSpinners() {
        val themeSpinner: Spinner = findViewById(R.id.themeSpinner)
        val themeIdentifiers = listOf("light", "dark", "valentines", "christmas")
        val themeDisplayNames = resources.getStringArray(R.array.theme_options)

        if (themeIdentifiers.size != themeDisplayNames.size) {
            Log.e("SettingsActivity", "Mismatch between theme identifiers and display names.")
            return
        }
        val allThemes = themeIdentifiers.mapIndexed { index, identifier ->
            ThemeOption(
                themeName = identifier,
                isOwned = defaultThemes.contains(identifier) || ownedThemes.contains(identifier),
                displayName = themeDisplayNames[index]
            )
        }
        val adapter = ThemeSpinnerAdapter(this, allThemes)
        themeSpinner.adapter = adapter
        // Set initial selection based on currentTheme
        val initialPosition = allThemes.indexOfFirst { it.themeName == currentTheme }
        if (initialPosition >= 0) {
            themeSpinner.setSelection(initialPosition)
        }
        themeSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, position: Int, id: Long) {
                val selectedTheme = allThemes[position]
                if (!selectedTheme.isOwned) {
                    // Theme is locked, show message or redirect to ShopActivity
                    Toast.makeText(
                        this@SettingsActivity,
                        R.string.themeLocked,
                        Toast.LENGTH_SHORT
                    ).show()
                    // Redirect to ShopActivity
                    // val intent = Intent(this@SettingsActivity, ShopActivity::class.java)
                    //startActivity(intent)
                    // Reset spinner to current theme
                    val currentPos = allThemes.indexOfFirst { it.themeName == currentTheme }
                    if (currentPos >= 0) {
                        themeSpinner.setSelection(currentPos)
                    }
                    return
                }

                if (selectedTheme.themeName != currentTheme) {
                    currentTheme = selectedTheme.themeName
                    themeChanged = true
                    Log.d("SettingsActivity", "THEME_CHANGED is $themeChanged")
                    AuthUtils.storeUserTheme(this@SettingsActivity, selectedTheme.themeName)  // Store the new theme
                    Log.d("SettingsActivity", "Theme is changing to: ${selectedTheme.themeName}")
                    updateTheme(selectedTheme.themeName)
                    lifecycleScope.launch(Dispatchers.IO) {
                        try {
                            patchThemeToServer(selectedTheme.themeName)
                            //applyTheme(selectedTheme.themeName)

                        } catch (e: Exception) {
                            Log.e("SettingsActivity", "Failed to update theme on the server: ${e.message}")
                        }
                    }
                    recreate()

                }
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        val languageSpinner: Spinner = findViewById(R.id.languageSpinner)

        val langIdentifiers = listOf("fr", "en")
        val langDisplayNames = resources.getStringArray(R.array.language_options)

        if (langIdentifiers.size != langDisplayNames.size) {
            Log.e("SettingsActivity", "Mismatch between language identifiers and display names.")
            return
        }
        val languageOptions = langIdentifiers.mapIndexed { index, identifier ->
            LanguageOption(
                languageCode = identifier,
                displayName = langDisplayNames[index]
            )
        }

        val langAdapter = LangSpinnerAdapter(this, languageOptions)
        languageSpinner.adapter = langAdapter

        val langInitialPosition = languageOptions.indexOfFirst { it.languageCode == currentLanguage }
        if (initialPosition >= 0) {
            languageSpinner.setSelection(langInitialPosition)
        }

        languageSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: android.view.View?, position: Int, id: Long) {
                val selectedLanguage = if (position == 0) "fr" else "en"

                if (selectedLanguage != currentLanguage) {
                    currentLanguage = selectedLanguage
                    Log.d("SettingsActivity", "Lang is changing to: $selectedLanguage")
                    langChanged = true
                    Log.d("SettingsActivity", "THEME_CHANGED is $langChanged")
                    AuthUtils.storeUserLanguage(this@SettingsActivity, selectedLanguage)

                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            patchLanguageToServer(selectedLanguage)
                        } catch (e: Exception) {
                            Log.e("SettingsActivity", "Failed to update language on the server: ${e.message}")
                        }
                    }
                    recreate()
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
    }

    private fun getLanguageOptions(): List<LanguageOption> {
        return listOf(
            LanguageOption(languageCode = "fr", displayName = "Français"),
            LanguageOption(languageCode = "en", displayName = "English")
        )
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

    private fun saveProfileImageUri(uri: String) {
        val sharedPreferences = getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
        with(sharedPreferences.edit()) {
            putString("USER_PROFILE_PICTURE", uri)
            apply()
        }
        Log.d("SettingsActivity", "Profile image URI saved: $uri")

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


    private suspend fun uploadProfilePicture(avatar: Avatar) {
        try {
            accountService.updateAvatar(avatar.imageUrl)
            withContext(Dispatchers.Main) {
                Toast.makeText(this@SettingsActivity, getString(R.string.success_upload), Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e("SettingsActivity", "Failed to upload profile picture: ${e.message}", e)
            withContext(Dispatchers.Main) {
                Toast.makeText(this@SettingsActivity, getString(R.string.failed_upload), Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupAvatarRecyclerView() {
        val defaultAvatars = listOf(
            Avatar(1, R.drawable.m1, "m1.png"),
            Avatar(2, R.drawable.m2, "m2.png"),
            Avatar(3, R.drawable.m3, "m3.png"),
            Avatar(4, R.drawable.w1, "w1.jpg")
        )

        val shopAvatars = listOf(
            Avatar(1, R.drawable.akali, "akali.png"),
            Avatar(2, R.drawable.ww, "ww.png"),
            Avatar(3, R.drawable.yone, "yone.png"),
            Avatar(4, R.drawable.ahri, "ahri.png")
        )

        val ownedAvatarList = shopAvatars.filter { ownedAvatars.contains(it.imageUrl) }
            .mapIndexed { index, avatar ->
                avatar.copy(id = defaultAvatars.size + index + 1) // Assign unique IDs
            }

        val combinedAvatars = defaultAvatars + ownedAvatarList

        avatarAdapter = AvatarAdapter(combinedAvatars) { avatar ->
            selectedAvatar(avatar)
        }

        binding.avatarRecyclerView?.apply {
            layoutManager = GridLayoutManager(this@SettingsActivity, 3)
            adapter = avatarAdapter
        }
    }

    private fun selectedAvatar(avatar: Avatar) {
        lifecycleScope.launch {
            setProfilePicture(avatar.imageResId)
            AuthUtils.storeUserProfilePicture(this@SettingsActivity, avatar.imageResId, avatar.imageUrl)
            uploadProfilePicture(avatar)
        }
    }

    private suspend fun fetchAndLoadCurrentAvatar() {
        val accessToken = AuthUtils.getAccessToken(this)
        if (accessToken != null) {
            try {
                val avatarUrl = accountService.getProfilePicture()
                if (!avatarUrl.isNullOrEmpty()) {
                    if (avatarUrl.startsWith("data:image")) {
                        // Avatar personnalisé en base64
                        withContext(Dispatchers.Main) {
                            setProfilePicture(avatarUrl)
                            AuthUtils.storeUserProfilePicture(this@SettingsActivity, avatarUrl)
                            Log.d("SettingsActivity", "Fetched avatarUrl (base64) from server and saved to SharedPreferences: $avatarUrl")
                        }
                    } else {
                        // Avatar prédéfini
                        val imageResId = accountService.getResourceIdFromImageUrl(avatarUrl)
                        withContext(Dispatchers.Main) {
                            setProfilePicture(imageResId)
                            AuthUtils.storeUserProfilePicture(this@SettingsActivity, imageResId, avatarUrl)
                            Log.d("SettingsActivity", "Fetched avatarUrl from server and saved to SharedPreferences: $avatarUrl")
                        }
                    }
                } else {
                    Log.d("SettingsActivity", "No avatar URL found on server.")
                }
            } catch (e: Exception) {
                Log.e("SettingsActivity", "Failed to fetch current avatar: ${e.message}", e)
            }
        } else {
            Log.e("SettingsActivity", "Access token not found")
        }
    }

//    override fun onResume() {
//        super.onResume()
//        // Optional: Refresh owned themes in case they changed
//        lifecycleScope.launch(Dispatchers.IO) {
//            ownedThemes = getOwnedThemesFromServer() ?: listOf("light", "dark")
//            withContext(Dispatchers.Main) {
//                setupSpinners()
//            }
//        }
//    }
}

