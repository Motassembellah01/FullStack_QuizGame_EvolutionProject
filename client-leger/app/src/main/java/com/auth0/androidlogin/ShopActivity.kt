package com.auth0.androidlogin

import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.Window
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.AppCompatImageButton
import androidx.lifecycle.Observer
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewModelScope
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class ShopActivity : BaseActivity() {

    private val viewModel: ShopViewModel by viewModels()
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var accountService: AccountService

    private lateinit var textViewShopTitle: TextView
    private lateinit var textViewCookiesBalance: TextView

    private lateinit var buttonChristmasTheme: ImageButton
    private lateinit var lockChristmasTheme: ImageView
    private lateinit var priceChristmasTheme: TextView

    private lateinit var buttonValentineTheme: ImageButton
    private lateinit var lockValentineTheme: ImageView
    private lateinit var priceValentineTheme: TextView

    private lateinit var buttonAkali: ImageButton
    private lateinit var lockAkali: ImageView
    private lateinit var priceAkali: TextView

    private lateinit var buttonWW: ImageButton
    private lateinit var lockWW: ImageView
    private lateinit var priceWW: TextView

    private lateinit var buttonYone: ImageButton
    private lateinit var lockYone: ImageView
    private lateinit var priceYone: TextView

    private lateinit var buttonAhri: ImageButton
    private lateinit var lockAhri: ImageView
    private lateinit var priceAhri: TextView

    private lateinit var textAlreadyOwnedChristmas: TextView
    private lateinit var textAlreadyOwnedValentine: TextView
    private lateinit var textAlreadyOwnedAkali: TextView
    private lateinit var textAlreadyOwnedWW: TextView
    private lateinit var textAlreadyOwnedYone: TextView
    private lateinit var textAlreadyOwnedAhri: TextView

    private var money: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_shop)
        accountService = AccountService(this)

        sharedPreferences = AuthUtils.getSharedPreferences(this)

        money = AuthUtils.getCookieBalance(this) // Retrieve from "auth_prefs"

        val closeButton = findViewById<ImageButton>(R.id.closeShopButton)
        closeButton?.setOnClickListener {
            finish()
        }

        // Initialize UI Components
        initializeUI()

        // Load persisted data
        loadPersistedData()

        // Set up observers
        setupObservers()

        // Set up click listeners
        setupClickListeners()

        // Update UI based on initial data
        updateUI()

        // Fetch owned themes and avatars from the server
        lifecycleScope.launch(Dispatchers.IO) {
            val fetchedOwnedThemes = accountService.getOwnedThemes() ?: listOf()
            Log.d("ShopActivity", "list of owned themes: $fetchedOwnedThemes")
            val fetchedOwnedAvatars = accountService.getOwnedAvatars() ?: listOf()
            Log.d("ShopActivity", "list of owned avatars: $fetchedOwnedAvatars")

            withContext(Dispatchers.Main) {
                fetchedOwnedThemes.forEach { theme ->
                    viewModel.markItemAsPurchased(theme)
                }

                fetchedOwnedAvatars.forEach { avatar ->
                    viewModel.markItemAsPurchased(avatar)
                }
            }
        }
    }

    /**
     * Initializes all UI components by finding them via their IDs.
     */
    private fun initializeUI() {
        // Shop Title and Cookies Balance
        textViewShopTitle = findViewById(R.id.textview_shop_title)
        textViewCookiesBalance = findViewById(R.id.textview_cookies_balance)

        // Themes
        buttonChristmasTheme = findViewById(R.id.button_christmas_theme)
        lockChristmasTheme = findViewById(R.id.lock_christmas_theme)
        priceChristmasTheme = findViewById(R.id.price_christmas_theme)

        buttonValentineTheme = findViewById(R.id.button_valentine_theme)
        lockValentineTheme = findViewById(R.id.lock_valentine_theme)
        priceValentineTheme = findViewById(R.id.price_valentine_theme)

        // Avatars
        buttonAkali = findViewById(R.id.button_akali)
        lockAkali = findViewById(R.id.lock_akali)
        priceAkali = findViewById(R.id.price_akali)

        buttonWW = findViewById(R.id.button_ww)
        lockWW = findViewById(R.id.lock_ww)
        priceWW = findViewById(R.id.price_ww)

        buttonYone = findViewById(R.id.button_yone)
        lockYone = findViewById(R.id.lock_yone)
        priceYone = findViewById(R.id.price_yone)

        buttonAhri = findViewById(R.id.button_ahri)
        lockAhri = findViewById(R.id.lock_ahri)
        priceAhri = findViewById(R.id.price_ahri)

        // Initialize "Already Owned" TextViews
        textAlreadyOwnedChristmas = findViewById(R.id.text_already_owned_christmas)
        textAlreadyOwnedValentine = findViewById(R.id.text_already_owned_valentine)
        textAlreadyOwnedAkali = findViewById(R.id.text_already_owned_akali)
        textAlreadyOwnedWW = findViewById(R.id.text_already_owned_ww)
        textAlreadyOwnedYone = findViewById(R.id.text_already_owned_yone)
        textAlreadyOwnedAhri = findViewById(R.id.text_already_owned_ahri)
    }

    /**
     * Loads persisted data from SharedPreferences into the ViewModel.
     */
    private fun loadPersistedData() {
        val savedCookies = AuthUtils.getCookieBalance(this)
        val savedChristmasPurchased = sharedPreferences.getBoolean("christmas_purchased", false)
        val savedValentinePurchased = sharedPreferences.getBoolean("valentines_purchased", false)
        val savedAkaliPurchased = sharedPreferences.getBoolean("akali_purchased", false)
        val savedWWPurchased = sharedPreferences.getBoolean("ww_purchased", false)
        val savedYonePurchased = sharedPreferences.getBoolean("yone_purchased", false)
        val savedAhriPurchased = sharedPreferences.getBoolean("ahri_purchased", false)

        viewModel.setInitialCookies(savedCookies)
        viewModel.setPurchaseState("Christmas Theme", savedChristmasPurchased)
        viewModel.setPurchaseState("Valentines Theme", savedValentinePurchased)
        viewModel.setPurchaseState("Akali Avatar", savedAkaliPurchased)
        viewModel.setPurchaseState("WW Avatar", savedWWPurchased)
        viewModel.setPurchaseState("Yone Avatar", savedYonePurchased)
        viewModel.setPurchaseState("Ahri Avatar", savedAhriPurchased)
    }

    private fun setupObservers() {
        // Observe cookies balance
        viewModel.cookies.observe(this, Observer { balance ->
            textViewCookiesBalance.text = "Cookies: $balance"
            saveCookies(balance)
            money = balance
        })

        // Observe purchase states for themes
        viewModel.christmasThemePurchased.observe(this, Observer { purchased ->
            lockChristmasTheme.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedChristmas.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                buttonChristmasTheme.isEnabled = false
                buttonChristmasTheme.alpha = 0.6f
                loadImageWithoutBlur(buttonChristmasTheme, R.drawable.christmas_tn)
            } else {
                buttonChristmasTheme.isEnabled = true
                buttonChristmasTheme.alpha = 1.0f
                loadImageWithBlur(buttonChristmasTheme, R.drawable.christmas_blurred)
            }
            savePurchaseState("christmas_purchased", purchased)
        })

        viewModel.valentineThemePurchased.observe(this, Observer { purchased ->
            lockValentineTheme.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedValentine.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                loadImageWithoutBlur(buttonValentineTheme, R.drawable.valentines_tn)
                buttonValentineTheme.isEnabled = false
                buttonValentineTheme.alpha = 0.6f
            } else {
                loadImageWithBlur(buttonValentineTheme, R.drawable.valentines_blurred)
                buttonValentineTheme.isEnabled = true
                buttonValentineTheme.alpha = 1.0f
            }
            savePurchaseState("valentines_purchased", purchased)
        })

        viewModel.avatar1Purchased.observe(this, Observer { purchased ->
            lockAkali.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedAkali.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                loadImageWithoutBlur(buttonAkali, R.drawable.akali)
                buttonAkali.isEnabled = false
                buttonAkali.alpha = 0.6f
            } else {
                loadImageWithBlur(buttonAkali, R.drawable.akali_blur)
                buttonAkali.isEnabled = true
                buttonAkali.alpha = 1.0f
            }
            savePurchaseState("akali_purchased", purchased)
        })

        viewModel.avatar2Purchased.observe(this, Observer { purchased ->
            lockWW.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedWW.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                loadImageWithoutBlur(buttonWW, R.drawable.ww)
                buttonWW.isEnabled = false
                buttonWW.alpha = 0.6f
            } else {
                loadImageWithBlur(buttonWW, R.drawable.ww_blur)
                buttonWW.isEnabled = true
                buttonWW.alpha = 1.0f
            }
            savePurchaseState("ww_purchased", purchased)
        })

        viewModel.avatar3Purchased.observe(this, Observer { purchased ->
            lockYone.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedYone.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                loadImageWithoutBlur(buttonYone, R.drawable.yone)
                buttonYone.isEnabled = false
                buttonYone.alpha = 0.6f
            } else {
                loadImageWithBlur(buttonYone, R.drawable.yone_blur)
                buttonYone.isEnabled = true
                buttonYone.alpha = 1.0f
            }
            savePurchaseState("yone_purchased", purchased)
        })

        viewModel.avatar4Purchased.observe(this, Observer { purchased ->
            lockAhri.visibility = if (purchased) View.GONE else View.VISIBLE
            textAlreadyOwnedAhri.visibility = if (purchased) View.VISIBLE else View.GONE
            if (purchased) {
                loadImageWithoutBlur(buttonAhri, R.drawable.ahri)
                buttonAhri.isEnabled = false
                buttonAhri.alpha = 0.6f
            } else {
                loadImageWithBlur(buttonAhri, R.drawable.ahri_blur)
                buttonAhri.isEnabled = true
                buttonAhri.alpha = 1.0f
            }
            savePurchaseState("ahri_purchased", purchased)
        })
    }

    private fun setupClickListeners() {
        // Themes
        buttonChristmasTheme.setOnClickListener {
            handlePurchase("christmas", 100)
        }

        buttonValentineTheme.setOnClickListener {
            handlePurchase("valentines", 100)
        }

        // Avatars
        buttonAkali.setOnClickListener {
            handlePurchase("akali.png", 50)
        }

        buttonWW.setOnClickListener {
            handlePurchase("ww.png", 50)
        }

        buttonYone.setOnClickListener {
            handlePurchase("yone.png", 50)
        }

        buttonAhri.setOnClickListener {
            handlePurchase("ahri.png", 50)
        }
    }

    private fun handlePurchase(itemName: String, price: Int) {
//        if (viewModel.isItemPurchased(itemName)) {
//            Toast.makeText(this, "$itemName is already owned!", Toast.LENGTH_SHORT).show()
//            return
//        }
        showPurchaseConfirmationDialog(itemName, price)
    }


    private fun showNotEnoughCookiesDialog() {
        val dialog = Dialog(this)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setContentView(R.layout.dialog_not_enough_cookies)

        val buttonDismiss = dialog.findViewById<AppCompatImageButton>(R.id.buttonDismiss)

        buttonDismiss.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun updateUI() {
        // This method can be used to set initial UI states if needed
    }

    private fun saveCookies(balance: Int) {
        AuthUtils.storeCookieBalance(this, balance)
    }

    private fun savePurchaseState(key: String, purchased: Boolean) {
//        with(sharedPreferences.edit()) {
//            putBoolean(key, purchased)
//            apply()
//        }
        with(AuthUtils.getSharedPreferences(this).edit()) {
            putBoolean(key, purchased)
            apply()
        }
        Log.d("ShopActivity", "Saved purchase state for $key: $purchased")
    }

    override fun onBackPressed() {
        val updatedCookies = viewModel.cookies.value ?: 200
        val resultIntent = Intent()
        resultIntent.putExtra("UPDATED_COOKIES_BALANCE", updatedCookies)
        setResult(RESULT_OK, resultIntent)
        super.onBackPressed()
    }

    private fun loadImageWithoutBlur(imageButton: ImageButton, imageResId: Int) {
        imageButton.setImageResource(imageResId)
    }

    private fun loadImageWithBlur(imageButton: ImageButton, imageResId: Int) {
        imageButton.setImageResource(imageResId)
    }

    private fun resetShopData() {
        with(sharedPreferences.edit()) {
            // putInt("cookies", 200)
            putBoolean("christmas_purchased", false)
            putBoolean("valentine_purchased", false)
            putBoolean("akali_purchased", false)
            putBoolean("ww_purchased", false)
            putBoolean("yone_purchased", false)
            putBoolean("ahri_purchased", false)
            apply()
        }
    }

    private fun showPurchaseConfirmationDialog(itemName: String, price: Int) {
        val dialogTitle = getString(R.string.purchase_confirm_title)
        val dialogMessage = getString(R.string.purchase_confirm_message, itemName, price)
        val submitText = getString(R.string.submit)
        val cancelText = getString(R.string.cancel)

        val builder = AlertDialog.Builder(this)
        builder.setTitle(dialogTitle)
        builder.setMessage(dialogMessage)
        builder.setPositiveButton(submitText) { dialog, _ ->
            proceedWithPurchase(itemName, price)
            dialog.dismiss()
        }
        builder.setNegativeButton(cancelText) { dialog, _ ->
            dialog.dismiss()
        }
        val dialog = builder.create()
        dialog.show()
    }


    private fun proceedWithPurchase(itemName: String, price: Int) {
        if (viewModel.cookies.value!! < price) {
            showNotEnoughCookiesDialog()
            return
        }
        viewModel.purchaseItem(itemName, price)
        lifecycleScope.launch {
            try {
                when (itemName.toLowerCase(Locale.ROOT)) {
                    "christmas", "valentines" -> {
                        val ownedThemes = accountService.getOwnedThemes()?.toMutableList() ?: mutableListOf()
                        if (!ownedThemes.contains(itemName.toLowerCase(Locale.ROOT))) {
                            ownedThemes.add(itemName.toLowerCase(Locale.ROOT))
                        }
                        val updateThemesSuccess  = accountService.updateOwnedThemes(ownedThemes)
                        if (updateThemesSuccess ) {
                            val currentMoney = accountService.getAccountMoney() ?: 0
                            val newMoney = currentMoney - price
                            val updateMoneySuccess = accountService.updateAccountMoney(newMoney)
                            if (updateMoneySuccess) {
                                // viewModel.deductCookies(price)
                                viewModel.markItemAsPurchased(itemName)
                                saveCookies(newMoney)
                                Toast.makeText(
                                    this@ShopActivity,
                                    getString(R.string.purchased, itemName),
                                    Toast.LENGTH_SHORT
                                ).show()                            }
                        } else {
                            Toast.makeText(this@ShopActivity,  R.string.purchaseFailed, Toast.LENGTH_SHORT).show()
                        }
                    }
                    "akali.png", "ww.png", "yone.png", "ahri.png" -> {
                        val ownedAvatars = accountService.getOwnedAvatars()?.toMutableList() ?: mutableListOf()
                        if (!ownedAvatars.contains(itemName.toLowerCase(Locale.ROOT))) {
                            ownedAvatars.add(itemName.toLowerCase(Locale.ROOT))
                        }
                        val updateSuccess = accountService.updateOwnedAvatars(ownedAvatars)
                        if (updateSuccess) {
                            val currentMoney = accountService.getAccountMoney() ?: 0
                            val newMoney = currentMoney - price
                            val updateMoneySuccess = accountService.updateAccountMoney(newMoney)
                            if (updateMoneySuccess) {
                                //viewModel.deductCookies(price)
                                viewModel.markItemAsPurchased(itemName)
                                saveCookies(newMoney)
                                Toast.makeText(
                                    this@ShopActivity,
                                    getString(R.string.purchased, itemName),
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        } else {
                            Toast.makeText(this@ShopActivity, R.string.purchaseFailed, Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(this@ShopActivity, R.string.general_error, Toast.LENGTH_SHORT).show()
                //viewModel.addCookies(price)
            }
        }
    }
}
