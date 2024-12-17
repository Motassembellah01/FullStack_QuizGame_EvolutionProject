package com.auth0.androidlogin

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class ShopViewModel : ViewModel() {

    // LiveData for cookies balance
    private val _cookies = MutableLiveData<Int>()
    val cookies: LiveData<Int> get() = _cookies

    // LiveData for purchase states
    private val _christmasThemePurchased = MutableLiveData<Boolean>()
    val christmasThemePurchased: LiveData<Boolean> get() = _christmasThemePurchased

    private val _valentineThemePurchased = MutableLiveData<Boolean>()
    val valentineThemePurchased: LiveData<Boolean> get() = _valentineThemePurchased

    private val _avatar1Purchased = MutableLiveData<Boolean>()
    val avatar1Purchased: LiveData<Boolean> get() = _avatar1Purchased

    private val _avatar2Purchased = MutableLiveData<Boolean>()
    val avatar2Purchased: LiveData<Boolean> get() = _avatar2Purchased

    private val _avatar3Purchased = MutableLiveData<Boolean>()
    val avatar3Purchased: LiveData<Boolean> get() = _avatar3Purchased

    private val _avatar4Purchased = MutableLiveData<Boolean>()
    val avatar4Purchased: LiveData<Boolean> get() = _avatar4Purchased

//    init {
//        _cookies.value = 200
//        _christmasThemePurchased.value = false
//        _valentineThemePurchased.value = false
//        _avatar1Purchased.value = false
//        _avatar2Purchased.value = false
//        _avatar3Purchased.value = false
//        _avatar4Purchased.value = false
//    }

    // Methods to set initial data
    fun setInitialCookies(balance: Int) {
        _cookies.value = balance
    }

    fun setPurchaseState(item: String, purchased: Boolean) {
        when (item) {
            "christmas" -> _christmasThemePurchased.value = purchased
            "valentines" -> _valentineThemePurchased.value = purchased
            "akali.png" -> _avatar1Purchased.value = purchased
            "ww.png" -> _avatar2Purchased.value = purchased
            "yone.png" -> _avatar3Purchased.value = purchased
            "ahri.png" -> _avatar4Purchased.value = purchased
        }
    }

    // Method to handle purchases
    fun purchaseItem(item: String, price: Int): Boolean {
        val currentCookies = _cookies.value ?: 0
        if (!isItemPurchased(item) && currentCookies >= price) {
            _cookies.value = currentCookies - price
            setPurchaseState(item, true)
            return true
        }
        return false
    }

//    // Method to deduct cookies
//    fun deductCookies(price: Int) {
//        val currentCookies = _cookies.value ?: 0
//        _cookies.value = currentCookies - price
//    }

//    // Method to add cookies (for refund)
//    fun addCookies(price: Int) {
//        val currentCookies = _cookies.value ?: 0
//        _cookies.value = currentCookies + price
//    }

    // Method to mark an item as purchased
    fun markItemAsPurchased(item: String) {
        setPurchaseState(item, true)
    }

    fun isItemPurchased(item: String): Boolean {
        return when (item) {
            "christmas" -> _christmasThemePurchased.value ?: false
            "valentines" -> _valentineThemePurchased.value ?: false
            "akali.png" -> _avatar1Purchased.value ?: false
            "ww.png" -> _avatar2Purchased.value ?: false
            "yone.png" -> _avatar3Purchased.value ?: false
            "ahri.png" -> _avatar4Purchased.value ?: false
            else -> false
        }
    }
}
