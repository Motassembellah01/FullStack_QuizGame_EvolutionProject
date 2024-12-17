// com/auth0/androidlogin/FriendsActivity.kt
package com.auth0.androidlogin

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import androidx.lifecycle.Observer
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import classes.FriendItem
import classes.FriendsAdapter
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.services.AccountService
import com.services.FriendService
import com.services.FriendSocketService
import interfaces.PartialAccount
import interfaces.dto.FriendRequestData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class FriendsActivity : BaseActivity() {
    private lateinit var btnAll: AppCompatButton
    private lateinit var btnFriends: AppCompatButton
    private lateinit var btnRequests: AppCompatButton
    private lateinit var searchInput: TextView
    private var searchTerm: String = ""
    private var currentTab: String = "Discover Community"
    private val allPlayers = mutableListOf<FriendItem>()
    private val friends = mutableListOf<FriendItem.Friend>()
    private val friendRequests = mutableListOf<FriendItem.FriendRequest>()
    private lateinit var accountService: AccountService
    private lateinit var friendService: FriendService
    private lateinit var friendsAdapter: FriendsAdapter
    private lateinit var exitButton: ImageButton
    private lateinit var requestBadge: TextView
    private var _blockedUsers: List<String> = emptyList() // Utilisateurs bloqués par vous
    private var _usersBlockingMe: List<String> = emptyList() // Utilisateurs qui vous bloquent


    // Variables pour suivre les états précédents
    private var previousSentRequests = emptyList<String>()
    private var previousFriends = emptyList<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_friends)

        // Connexion au service de socket
        FriendSocketService.connect()

        // Initialisation des vues
        exitButton = findViewById(R.id.exitButton)
        btnAll = findViewById(R.id.btnAll)
        btnFriends = findViewById(R.id.btnFriends)
        btnRequests = findViewById(R.id.btnRequests)
        searchInput = findViewById(R.id.searchFriends)
        requestBadge = findViewById(R.id.requestBadge)

        // Initialisation des services
        accountService = AccountService(this)
        friendService = FriendService(this)

        // Configuration du RecyclerView
        val recyclerView: RecyclerView = findViewById(R.id.friendsRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        friendsAdapter = FriendsAdapter(
            onSendFriendRequest = { userId ->
                sendFriendRequest(userId)
            },
            onAcceptRequest = { requestId ->
                handleAcceptRequest(requestId)
            },
            onRejectRequest = { requestId ->
                handleRejectRequest(requestId)
            },
            onRemoveFriend = { userId ->
                removeFriend(userId)
            },
            onBlockUser = { userId -> blockUser(userId)},
            avatarLoader = { userId, imageView ->
                lifecycleScope.launch(Dispatchers.IO) {
                    try {
                        val avatarUrl = accountService.getAvatarByUserId(userId)
                        withContext(Dispatchers.Main) {
                            loadAvatar(imageView,null,null, avatarUrl)
                        }

                    } catch (e: Exception) {
                        Log.e("FriendsActivity", "Échec du chargement de l'avatar pour userId $userId: ${e.message}")
                        withContext(Dispatchers.Main) {
                            imageView.setImageResource(R.drawable.image_not_found)
                        }
                    }
                }
            }
        )
        recyclerView.adapter = friendsAdapter
        updateRequestBadge()
        requestBadge.post {
            requestBadge.invalidate()
            requestBadge.requestLayout()
        }
        // Configuration des boutons et de la barre de recherche
        setupButtons()
        setupSearch()

        // Configuration des observateurs de socket
        observeSocketEvents()

        // Récupérer les données initiales
        fetchInitialData()
    }

//    override fun onDestroy() {
//        super.onDestroy()
//        // Déconnexion du service de socket
//        FriendSocketService.resetService()
//    }

    private fun setupButtons() {
        btnAll.setOnClickListener {
            currentTab = "Discover Community"
            updateRecyclerView(allPlayers)
            highlightButton(btnAll)
        }

        btnFriends.setOnClickListener {
            currentTab = "Friends"
            updateRecyclerView(friends)
            highlightButton(btnFriends)
        }

        btnRequests.setOnClickListener {
            currentTab = "Friend Requests"
            updateRecyclerView(friendRequests)
            highlightButton(btnRequests)
        }

        exitButton.setOnClickListener {
            finish()
        }

        highlightButton(btnAll)
    }

    private fun updateRequestBadge() {
        lifecycleScope.launch(Dispatchers.Main) {
            val count = friendRequests.size
            if (count > 0) {
                requestBadge.text = count.toString()
                requestBadge.visibility = View.VISIBLE
            } else {
                requestBadge.visibility = View.GONE
            }
        }
    }


    private fun setupSearch() {
        searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchTerm = s.toString()
                filterAndDisplayAccounts()
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun observeSocketEvents() {
        // Observer les demandes d'ami reçues
        FriendSocketService.newAccounts.observe(this) { newAccounts ->
            if (!newAccounts.isNullOrEmpty()) {
                Log.d("FriendsActivity", "Nouveaux comptes reçus : $newAccounts")
                addNewAccountsToAllPlayers(newAccounts)
            }
        }
        FriendSocketService.friendRequestsReceived.observe(this, Observer { requests ->
            if (requests != null) {
                Log.d("FriendsActivity", "Nouvelles demandes d'ami: $requests")
                handleNewFriendRequests(requests)
            } else {
                Log.e("FriendsActivity", "Erreur lors de la réception des demandes d'ami.")
            }
        })

        // Observer les demandes d'ami envoyées
        FriendSocketService.friendsThatUserRequested.observe(this, Observer { sentRequests ->
            if (sentRequests != null) {
                Log.d("FriendsActivity", "Demandes d'ami envoyées mises à jour: $sentRequests")
                handleSentFriendRequests(sentRequests)
            } else {
                Log.e("FriendsActivity", "Erreur lors de la réception des demandes d'ami envoyées.")
            }
        })

        // Observer la liste d'amis
        FriendSocketService.friends.observe(this, Observer { updatedFriends ->
            if (updatedFriends != null) {
                Log.d("FriendsActivity", "Liste d'amis mise à jour: $updatedFriends")
                handleFriendsListUpdate(updatedFriends)
            } else {
                Log.e("FriendsActivity", "Erreur lors de la mise à jour de la liste d'amis.")
            }
        })

        // Observer les utilisateurs bloqués
        FriendSocketService.blocked.observe(this, Observer { blockedUsers ->
            if (blockedUsers != null) {
                Log.d("FriendsActivity", "Liste des utilisateurs bloqués mise à jour: $blockedUsers")
                handleBlockedUsersUpdate(blockedUsers.filterNotNull())
            } else {
                Log.e("FriendsActivity", "Erreur lors de la mise à jour de la liste des utilisateurs bloqués.")
            }
        })

        // Observer les utilisateurs qui ont bloqué l'utilisateur actuel
        FriendSocketService.usersBlockingMe.observe(this, Observer { blockingUsers ->
            if (blockingUsers != null) {
                Log.d("FriendsActivity", "Liste des utilisateurs me bloquant mise à jour: $blockingUsers")
                handleUsersBlockingMeUpdate(blockingUsers)
            } else {
                Log.e("FriendsActivity", "Erreur lors de la mise à jour de la liste des utilisateurs me bloquant.")
            }
        })
    }

    private fun addNewAccountsToAllPlayers(newAccounts: List<PartialAccount>) {
        lifecycleScope.launch {
            try {
                val currentUserId = AuthUtils.getUserId(this@FriendsActivity) ?: return@launch

                // Filtrer les nouveaux comptes pour exclure ceux qui sont bloqués ou qui bloquent l'utilisateur
                val filteredAccounts = newAccounts.filter { account ->
                    account.userId != null &&
                        account.userId != currentUserId && // Exclure l'utilisateur lui-même
                        !_blockedUsers.contains(account.userId) && // Exclure les utilisateurs bloqués
                        !_usersBlockingMe.contains(account.userId) // Exclure ceux qui bloquent l'utilisateur
                }.map { account ->
                    FriendItem.DiscoverPlayer(
                        userId = account.userId!!,
                        username = account.pseudonym!!,
                        isPending = false
                    )
                }

                // Supprimer les doublons (utilisateurs déjà présents dans allPlayers)
                allPlayers.removeAll { player ->
                    filteredAccounts.any { newAccount -> newAccount.userId == player.userId }
                }

                // Ajouter les comptes filtrés
                allPlayers.addAll(filteredAccounts)

                Log.d("FriendsActivity", "Nouveaux comptes ajoutés à allPlayers : $filteredAccounts")

                // Rafraîchir l'affichage si l'onglet actuel est "Discover Community"
                if (currentTab == "Discover Community") {
                    updateRecyclerView(allPlayers)
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de l'ajout des nouveaux comptes : ${e.message}")
            }
        }
    }


    private fun handleNewFriendRequests(requests: List<FriendRequestData>) {
        Log.d("FriendsActivity", "handleNewFriendRequests - Début, demandes reçues : $requests")
        lifecycleScope.launch(Dispatchers.Main) {
            try {
                friendRequests.clear()
                val updatedFriendRequests = requests.map { request ->
                    val senderUsername = request.senderBasicInfo?.pseudonym ?: "Unknown"
                    val senderUserId = request.senderBasicInfo?.userId ?: "UnknownUserId"

                    FriendItem.FriendRequest(
                        requestId = request.requestId ?: "UnknownRequest",
                        userId = senderUserId,
                        username = senderUsername
                    )
                }
                friendRequests.addAll(updatedFriendRequests)
                Log.d("FriendsActivity", "friendRequests mis à jour : $friendRequests")

                // Mettre à jour allPlayers en remplaçant les DiscoverPlayer par des FriendRequest
                val requestUserIds = updatedFriendRequests.map { it.userId }.toSet()

                // Utiliser une boucle pour remplacer les éléments
                for (i in allPlayers.indices) {
                    val item = allPlayers[i]
                    if (item is FriendItem.DiscoverPlayer && requestUserIds.contains(item.userId)) {
                        val request = updatedFriendRequests.find { it.userId == item.userId }
                        if (request != null) {
                            allPlayers[i] = request
                            Log.d("FriendsActivity", "allPlayers mis à jour à l'index $i avec : ${allPlayers[i]}")
                        }
                    }
                }

                // Ajouter les nouvelles demandes qui ne sont pas déjà dans allPlayers
                updatedFriendRequests.forEach { request ->
                    val existsInAllPlayers = allPlayers.any { item ->
                        when (item) {
                            is FriendItem.DiscoverPlayer -> item.userId == request.userId
                            is FriendItem.FriendRequest -> item.userId == request.userId
                            is FriendItem.Friend -> item.userId == request.userId
                            else -> false
                        }
                    }
                    if (!existsInAllPlayers) {
                        allPlayers.add(request)
                        friendsAdapter.updateData(allPlayers)
                        Log.d("FriendsActivity", "Nouveau FriendRequest ajouté à allPlayers : $request")
                    }
                }
                Log.d("FriendsActivity", "allPlayers après mise à jour : $allPlayers")
                updateRequestBadge()

                // Mettre à jour l'UI en fonction de l'onglet actif
                Log.d("FriendsActivity", "currentTab est : $currentTab")
                when (currentTab) {
                    "Friend Requests" -> {
                        friendsAdapter.updateData(friendRequests)
                        Log.d("FriendsActivity", "Adapter mis à jour avec friendRequests")
                    }
                    "Discover Community" -> {
                        updateRecyclerView(allPlayers)
                        Log.d("FriendsActivity", "Adapter mis à jour avec allPlayers (avec FriendRequests)")
                    }
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors du traitement des demandes d'ami : ${e.message}", e)
//                Toast.makeText(
//                    this@FriendsActivity,
//                    "Une erreur est survenue lors du chargement des demandes d'ami.",
//                    Toast.LENGTH_SHORT
//                ).show()
            }
        }
    }
    private fun handleSentFriendRequests(newSentRequests: List<String>) {
        // Comparez les demandes précédentes avec les nouvelles (supposons que newSentRequests est une liste de userId)
        val removedRequests = previousSentRequests - newSentRequests
        val addedRequests = newSentRequests - previousSentRequests

        // Mettre à jour la liste précédente
        previousSentRequests = newSentRequests

        // Gérer les demandes supprimées (acceptées ou rejetées)
        removedRequests.forEach { userId ->
            lifecycleScope.launch {
                // Vérifier si l'utilisateur est maintenant un ami
                val isFriend = withContext(Dispatchers.IO) { accountService.getFriends().contains(userId) }
                if (isFriend) {
                    // Si accepté, retirer de allPlayers
                    removeUserFromAllPlayers(userId)
                } else {
                    // Si rejeté, remettre dans add_friend
                    setUserPendingStatus(userId, false)
                }
            }
        }

        // Gérer les nouvelles demandes envoyées
        addedRequests.forEach { userId ->
            setUserPendingStatus(userId, true)
        }
    }

    private fun handleFriendsListUpdate(updatedFriends: List<String>) {
        val addedFriends = updatedFriends - previousFriends
        val removedFriends = previousFriends - updatedFriends

        previousFriends = updatedFriends

        addedFriends.forEach { userId ->
            lifecycleScope.launch {
                val username = withContext(Dispatchers.IO) { accountService.getUsernameByUserId(userId) }
                if (username != null) {
                    friends.add(FriendItem.Friend(userId = userId, username = username))
                    friendsAdapter.updateData(friends)
                    Log.d("FriendsActivity", "Ami ajouté : $username")

                    // Retirer de allPlayers
                    removeUserFromAllPlayers(userId)
                }
            }
        }
        // Retirer les amis supprimés
        removedFriends.forEach { userId ->
            lifecycleScope.launch {
                val username = withContext(Dispatchers.IO) { accountService.getUsernameByUserId(userId) }
                if (username != null) {
                    friends.removeAll { it.userId == userId }
                    friendsAdapter.updateData(friends)
                    Log.d("FriendsActivity", "Ami retiré : $username")

                    // Remettre dans allPlayers si nécessaire
                    if (!allPlayers.any { it.userId == userId }) {
                        addUserToAllPlayers(userId)
                    }
                }
            }
        }

        // Mettre à jour l'UI si l'onglet "Friends" est actif
        if (currentTab == "Friends") {
            friendsAdapter.updateData(friends)
            Log.d("FriendsActivity", "Adapter mis à jour avec friends")
        }
    }

    private fun handleBlockedUsersUpdate(blockedUsers: List<String?>) {
        Log.d("FriendsActivity", "Blocked users updated: $blockedUsers")
        _blockedUsers = blockedUsers.filterNotNull()
        // Remove blocked users from all active lists
        allPlayers.removeAll { it.userId in _blockedUsers  }
        friends.removeAll { it.userId in _blockedUsers  }
        friendRequests.removeAll { it.userId in _blockedUsers  }

        // Mark blocked users in the allPlayers list (if necessary)
        allPlayers.forEachIndexed { index, item ->
            if (item.userId in blockedUsers) {
                allPlayers[index] = when (item) {
                    is FriendItem.DiscoverPlayer -> item.copy(isBlocked = true)
                    is FriendItem.Friend -> item.copy(isBlocked = true)
                    is FriendItem.FriendRequest -> item.copy(isBlocked = true)
                }
            }
        }

        // Refresh UI for the active tab
        when (currentTab) {
            "Friends" -> updateRecyclerView(friends)
            "Friend Requests" -> updateRecyclerView(friendRequests)
            "Discover Community" -> updateRecyclerView(allPlayers)
        }

        Log.d("FriendsActivity", "UI updated to reflect blocked users.")
        filterAndDisplayAccounts()
    }


    private fun handleUsersBlockingMeUpdate(blockingUsers: List<String?>) {
        Log.d("FriendsActivity", "Handling users blocking me: $blockingUsers")

        // Filter out null user IDs for safety
        _usersBlockingMe = blockingUsers.filterNotNull()

        // Remove users blocking me from all visible lists
        allPlayers.removeAll { it.userId in _usersBlockingMe  }
        friends.removeAll { it.userId in _usersBlockingMe  }
        friendRequests.removeAll { it.userId in _usersBlockingMe  }

        // Optionally log the updates
        Log.d("FriendsActivity", "Updated allPlayers: $allPlayers")
        Log.d("FriendsActivity", "Updated friends: $friends")
        Log.d("FriendsActivity", "Updated friendRequests: $friendRequests")

        // Update the UI based on the current tab
        when (currentTab) {
            "Friends" -> updateRecyclerView(friends)
            "Friend Requests" -> updateRecyclerView(friendRequests)
            "Discover Community" -> updateRecyclerView(allPlayers)
        }

        // Call filterAndDisplayAccounts to apply any active search filters
        filterAndDisplayAccounts()

        Log.d("FriendsActivity", "UI updated for users blocking me.")
    }


    private fun removeUserFromAllPlayers(userId: String) {
        val index = allPlayers.indexOfFirst { it.userId == userId }
        if (index != -1) {
            allPlayers.removeAt(index)
            Log.d("FriendsActivity", "Utilisateur retiré de Discover Community: $userId")
            if (currentTab == "Discover Community") {
                friendsAdapter.updateData(allPlayers)  // Update adapter's data
                friendsAdapter.notifyDataSetChanged() // Ensure UI reflects changes
            }
        }
    }

    private fun addUserToAllPlayers(userId: String) {
        // Vérifiez si l'utilisateur existe déjà dans allPlayers
        if (allPlayers.any { it.userId == userId }) {
            Log.d("FriendsActivity", "Utilisateur déjà présent dans Discover Community : $userId")
            return // Éviter un ajout en double
        }

        // Vérifiez si l'utilisateur est bloqué ou vous bloque
        if (_blockedUsers.contains(userId) || _usersBlockingMe.contains(userId)) {
            Log.d("FriendsActivity", "Utilisateur bloqué ou vous bloquant : $userId. Ajout annulé.")
            return // Ne pas ajouter cet utilisateur
        }

        // Récupérer les détails de l'utilisateur
        lifecycleScope.launch {
            try {
                val username = withContext(Dispatchers.IO) { accountService.getUsernameByUserId(userId) }
                if (username != null) {
                    val discoverPlayer = FriendItem.DiscoverPlayer(
                        userId = userId,
                        username = username,
                        isPending = false
                    )
                    allPlayers.add(discoverPlayer)
                    Log.d("FriendsActivity", "Utilisateur ajouté à Discover Community: $username")

                    // Mettre à jour l'affichage si nécessaire
                    if (currentTab == "Discover Community") {
                        updateRecyclerView(allPlayers)
                    }
                } else {
                    Log.e("FriendsActivity", "Impossible de récupérer le username pour userId: $userId")
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de l'ajout de l'utilisateur $userId : ${e.message}")
            }
        }
    }


    private fun setUserPendingStatus(userId: String, isPending: Boolean) {
        val index = allPlayers.indexOfFirst { it.userId == userId }
        if (index != -1) {
            val player = allPlayers[index]
            if (player is FriendItem.DiscoverPlayer) {
                // Créer une nouvelle instance avec isPending mis à jour
                val updatedPlayer = player.copy(isPending = isPending)
                // Créer une nouvelle liste avec l'élément mis à jour
                val newAllPlayers = allPlayers.toMutableList()
                newAllPlayers[index] = updatedPlayer
                // Mettre à jour allPlayers
                allPlayers.clear()
                allPlayers.addAll(newAllPlayers)
                Log.d("FriendsActivity", "Mise à jour isPending pour userId $userId à $isPending")
                // Re-filtrer et mettre à jour l'adaptateur
                filterAndDisplayAccounts()
            } else {
                Log.e("FriendsActivity", "Le joueur avec userId $userId n'est pas un DiscoverPlayer, impossible de mettre à jour isPending.")
            }
        } else {
            // Ajouter l'utilisateur à allPlayers avec le statut isPending spécifié
            lifecycleScope.launch {
                val username = withContext(Dispatchers.IO) { accountService.getUsernameByUserId(userId) }
                if (username != null) {
                    val discoverPlayer = FriendItem.DiscoverPlayer(
                        userId = userId,
                        username = username,
                        isPending = isPending  // Définir isPending ici
                    )
                    // Créer une nouvelle liste
                    val newAllPlayers = allPlayers.toMutableList()
                    newAllPlayers.add(discoverPlayer)
                    // Mettre à jour allPlayers
                    allPlayers.clear()
                    allPlayers.addAll(newAllPlayers)
                    Log.d("FriendsActivity", "Utilisateur ajouté à Discover Community avec isPending=$isPending: $username")
                    // Re-filtrer et mettre à jour l'adaptateur
                    filterAndDisplayAccounts()
                } else {
                    Log.e("FriendsActivity", "Échec de l'ajout à allPlayers pour userId $userId: username null")
                }
            }
        }
    }

    private fun showBlockConfirmationDialog(userId: String, onConfirm: () -> Unit) {
        // Inflate the custom layout
        val dialogView = layoutInflater.inflate(R.layout.custom_dialog_block, null)

        // Find views in the custom layout
        val messageTextView: TextView = dialogView.findViewById(R.id.dialog_message)
        val positiveButton: Button = dialogView.findViewById(R.id.dialog_positive_button)
        val negativeButton: Button = dialogView.findViewById(R.id.dialog_negative_button)

        // Create the dialog
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(true) // Allow canceling the dialog
            .create()

        // Set button click listeners
        positiveButton.setOnClickListener {
            dialog.dismiss() // Close the dialog
            onConfirm() // Execute the block action
        }

        negativeButton.setOnClickListener {
            dialog.dismiss() // Close the dialog without any action
        }

        // Show the dialog
        dialog.show()

        // Fetch the username asynchronously
        lifecycleScope.launch {
            try {
                val username = withContext(Dispatchers.IO) {
                    accountService.getUsernameByUserId(userId)
                }

                // Update the dialog message with the retrieved username
                messageTextView.text = getString(R.string.dialogConfirmationBlock) + " " + username + " ?"

            } catch (e: Exception) {
                Log.e("FriendsActivity", "Error fetching username for userId $userId: ${e.message}")
                messageTextView.text = getString(R.string.dialogConfirmationBlock)
            }
        }
    }


    private fun transformFriendRequestToDiscoverPlayer(userId: String) {
        val index = allPlayers.indexOfFirst { it.userId == userId }
        if (index != -1) {
            val item = allPlayers[index]
            if (item is FriendItem.FriendRequest) {
                val discoverPlayer = FriendItem.DiscoverPlayer(
                    userId = item.userId,
                    username = item.username,
                    isPending = false
                )
                allPlayers[index] = discoverPlayer
                Log.d("FriendsActivity", "FriendRequest transformé en DiscoverPlayer pour userId: $userId")

                // Mettre à jour l'interface utilisateur
                if (currentTab == "Discover Community") {
                    updateRecyclerView(allPlayers)
                }
            } else {
                Log.e("FriendsActivity", "L'élément avec userId $userId n'est pas un FriendRequest dans allPlayers.")
            }
        } else {
            // Ne rien faire si l'utilisateur n'est pas dans allPlayers
            Log.d("FriendsActivity", "Utilisateur avec userId $userId non trouvé dans allPlayers. Aucune transformation effectuée.")
        }
    }



    private fun updateItem(userId: String) {
        val index = allPlayers.indexOfFirst { it.userId == userId }
        if (index != -1) {
            // Notifier l'adaptateur que l'élément a changé
            runOnUiThread{
                friendsAdapter.notifyItemChanged(index)
            }
            Log.d("FriendsActivity", "Item mis à jour à l'index $index pour userId $userId")
        }
    }



    private fun filterAndDisplayAccounts() {
        val filteredAccounts = when (currentTab) {
            "Friends" -> if (searchTerm.isEmpty()) friends else friends.filter { it.username.contains(searchTerm, ignoreCase = true) }
            "Friend Requests" -> if (searchTerm.isEmpty()) friendRequests else friendRequests.filter { it.username.contains(searchTerm, ignoreCase = true) }
            else -> if (searchTerm.isEmpty()) allPlayers else allPlayers.filter { it.username.contains(searchTerm, ignoreCase = true) }
        }.toList() // Crée une nouvelle liste
        updateRecyclerView(filteredAccounts)
    }


    private fun fetchInitialData() {
        lifecycleScope.launch {
            try {
                val allAccountsDeferred = async(Dispatchers.IO) { accountService.getAccounts() }
                val friendsDeferred = async(Dispatchers.IO) { accountService.getFriends() }
                val friendRequestsDeferred = async(Dispatchers.IO) { accountService.getFriendRequests() }
                val pendingRequestsDeferred = async(Dispatchers.IO) { accountService.getFriendRequestsThatUserRequested() }
                val blockingMeDeferred = async(Dispatchers.IO) {accountService.getUsersBlockingMe()}
                val blockedDeferred  = async(Dispatchers.IO) {accountService.getBlockedUsers()}

                val allAccounts = allAccountsDeferred.await()
                val friendIds = friendsDeferred.await()
                val requests = friendRequestsDeferred.await()
                val pending = pendingRequestsDeferred.await()
                val blockingMe = blockingMeDeferred.await()
                val blocked = blockedDeferred.await()
                Log.d("fetchInitialData", "Blocking Me: $blockingMe")
                Log.d("fetchInitialData", "Blocked Users: $blocked")

                val requestUserIds = requests.mapNotNull { it.senderBasicInfo?.userId }.toSet()
                // Initialiser les listes précédentes
                _usersBlockingMe = blockingMe as List<String>
                _blockedUsers = blocked as List<String>
                previousFriends = friendIds
                previousSentRequests = pending
                Log.d("fetchInitialData", "Blocking Me: $_usersBlockingMe")
                Log.d("fetchInitialData", "Blocked Users: $_blockedUsers")

                // Remplir "Discover Community"
                allPlayers.clear()
                val currentUserId = AuthUtils.getUserId(this@FriendsActivity) ?: return@launch
                allPlayers.addAll(
                    allAccounts.filter { account ->
                        account.userId != null &&
                            account.userId != currentUserId &&
                            !friendIds.contains(account.userId) &&
                            !_usersBlockingMe.contains(account.userId) &&
                            !_blockedUsers.contains(account.userId)
                    }.map { account ->
                        val userId = account.userId!!
                        val username = account.pseudonym

                        if (requestUserIds.contains(userId)) {
                            // Si une demande d'ami est reçue de cet utilisateur
                            val request = requests.find { it.senderBasicInfo?.userId == userId }
                            FriendItem.FriendRequest(
                                requestId = request?.requestId ?: "UnknownRequest",
                                userId = userId,
                                username = username
                            )
                        } else {
                            // Sinon, c'est un DiscoverPlayer
                            FriendItem.DiscoverPlayer(
                                userId = userId,
                                username = username,
                                isPending = pending.contains(userId)
                            )
                        }
                    }
                )

                Log.d("FriendsActivity", "allPlayers initialisé: $allPlayers")
                Log.d("FriendsActivity", "allPlayers pending: $pending")

                // Remplir les Amis
                friends.clear()
                friends.addAll(friendIds.mapNotNull {
                    accountService.getUsernameByUserId(it)?.let { username ->
                        FriendItem.Friend(userId = it, username = username)
                    }
                })
                Log.d("FriendsActivity", "Liste des amis initialisée: $friends")

                // Remplir les Demandes Entrantes
                friendRequests.clear()
                friendRequests.addAll(requests.map { request ->
                    val senderUsername = request.senderBasicInfo?.pseudonym ?: "Unknown"
                    val senderUserId = request.senderBasicInfo?.userId ?: "UnknownUserId"

                    FriendItem.FriendRequest(
                        requestId = request.requestId ?: "UnknownRequest",
                        userId = senderUserId,
                        username = senderUsername
                    )
                })

                Log.d("FriendsActivity", "friendRequests initialisé: $friendRequests")

                // Mettre à jour l'UI pour l'onglet actuel
                updateRecyclerView(allPlayers)
                updateRequestBadge()
                Log.d("FriendsActivity", "UI mise à jour avec allPlayers")
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de la récupération des données: ${e.message}")
            }
        }
    }

    private fun updateRecyclerView(data: List<FriendItem>) {
        lifecycleScope.launch(Dispatchers.Main) {
            friendsAdapter.updateData(data)
            // Only notify changes if the data size or specific items change
            if (data.size != allPlayers.size) {
                friendsAdapter.notifyDataSetChanged()
            }
        }
    }


    private fun loadAvatar(imageView: ImageView, resId: Int?, base64: String?, avatarUrl: String?) {
        when {
            resId != null && resId != 0 -> {
                Glide.with(this)
                    .load(resId)
                    .apply(
                        com.bumptech.glide.request.RequestOptions()
                            .placeholder(R.drawable.image_not_found)
                            .error(R.drawable.image_not_found)
                            .circleCrop()
                    )
                    .into(imageView)
            }
            !base64.isNullOrEmpty() -> {
                Glide.with(this)
                    .load(base64)
                    .apply(
                        com.bumptech.glide.request.RequestOptions()
                            .placeholder(R.drawable.image_not_found)
                            .error(R.drawable.image_not_found)
                            .circleCrop()
                    )
                    .into(imageView)
            }
            !avatarUrl.isNullOrEmpty() -> {
                when {
                    avatarUrl.startsWith("data:image") -> {
                        Glide.with(this)
                            .load(avatarUrl)
                            .apply(
                                com.bumptech.glide.request.RequestOptions()
                                    .placeholder(R.drawable.image_not_found)
                                    .error(R.drawable.image_not_found)
                                    .circleCrop()
                            )
                            .into(imageView)
                    }
                    else -> {
                        val resIdFromUrl = accountService.getResourceIdFromImageUrl(avatarUrl)
                        if (resIdFromUrl != null && resIdFromUrl != 0) {
                            Glide.with(this)
                                .load(resIdFromUrl)
                                .apply(
                                    com.bumptech.glide.request.RequestOptions()
                                        .placeholder(R.drawable.image_not_found)
                                        .error(R.drawable.image_not_found)
                                        .circleCrop()
                                )
                                .into(imageView)
                        } else {
                            Glide.with(this)
                                .load(avatarUrl)
                                .apply(
                                    com.bumptech.glide.request.RequestOptions()
                                        .placeholder(R.drawable.image_not_found)
                                        .error(R.drawable.image_not_found)
                                        .circleCrop()
                                )
                                .into(imageView)
                        }
                    }
                }
            }
            else -> {
                imageView.setImageResource(R.drawable.image_not_found)
            }
        }
    }

    private fun highlightButton(selectedButton: AppCompatButton) {
        btnAll.setBackgroundResource(R.color.lightBlue)
        btnFriends.setBackgroundResource(R.color.lightBlue)
        btnRequests.setBackgroundResource(R.color.lightBlue)
        selectedButton.setBackgroundResource(R.color.lavender)
    }

    private fun sendFriendRequest(userId: String) {
        lifecycleScope.launch {
            try {
                val success = withContext(Dispatchers.IO) { friendService.sendFriendRequest(userId) }
                if (success) {
                    Toast.makeText(this@FriendsActivity, getString(R.string.sentFriendRequest) +" "+ accountService.getUsernameByUserId(userId), Toast.LENGTH_SHORT).show()
                    setUserPendingStatus(userId, true)
                } else {
                    Log.d("FriendsActivity","Échec de l'envoi de la demande d'ami.")
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de l'envoi de la demande d'ami : ${e.message}", e)
            }
        }
    }

    private fun removeFriend(userId: String) {
        lifecycleScope.launch {
            try {
                val success = withContext(Dispatchers.IO) { friendService.removeFriend(userId) }
                if (success) {
                    friends.removeAll { it.userId == userId }
                    Log.d("FriendsActivity", "Ami supprimé avec userId : $userId")
                    when (currentTab) {
                        "Friends" -> updateRecyclerView(friends)
                        "Discover Community" -> updateRecyclerView(allPlayers)
                        "Friend Requests" -> updateRecyclerView(friendRequests)
                    }
                    updateCurrentTabRecyclerView()
                    Toast.makeText(this@FriendsActivity, getString(R.string.removedFriendText), Toast.LENGTH_SHORT).show()
                } else {
                    Log.d("FriendsActivity", "Échec de la suppression de l'ami.")
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de la suppression de l'ami : ${e.message}")
            }
        }
    }

    private fun blockUser(userId: String) {
        showBlockConfirmationDialog(userId) {
            lifecycleScope.launch {
                try {
                    val isFriend = withContext(Dispatchers.IO) {
                        accountService.getFriends().contains(userId)
                    }
                    val isPendingRequest = withContext(Dispatchers.IO) {
                        accountService.getFriendRequests().any { it.senderBasicInfo?.userId == userId }
                    }
                    val isUserRequested = withContext(Dispatchers.IO) {
                        accountService.getFriendRequestsThatUserRequested().contains(userId)
                    }

                    val success = when {
                        isFriend -> {
                            withContext(Dispatchers.IO) { friendService.blockFriend(userId) }
                        }
                        isPendingRequest || isUserRequested -> {
                            withContext(Dispatchers.IO) { friendService.blockUserWithPendingRequest(userId) }
                        }
                        else -> {
                            withContext(Dispatchers.IO) { friendService.blockNormalUser(userId) }
                        }
                    }

                    if (success) {
                        val username = withContext(Dispatchers.IO) {
                            accountService.getUsernameByUserId(userId)
                        }
                        Toast.makeText(
                            this@FriendsActivity,
                            "$username ${getString(R.string.blocked)}",
                            Toast.LENGTH_SHORT
                        ).show()
                        handleBlockedUsersUpdate(listOf(userId))
                    } else {
                        Toast.makeText(
                            this@FriendsActivity,
                            "Failed to block $userId.",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Log.e("FriendsActivity", "Error blocking user $userId: ${e.message}")
                }
            }
        }
    }


    private fun handleAcceptRequest(requestId: String) {
        Log.d("FriendsActivity", "handleAcceptRequest called with requestId: $requestId")
        lifecycleScope.launch {
            try {
                val success = withContext(Dispatchers.IO) { friendService.acceptFriendRequest(requestId) }
                if (success) {
                    val acceptedRequest = friendRequests.find { it.requestId == requestId }
                    if (acceptedRequest != null) {
                        Log.d("FriendsActivity", "Demande d'ami trouvée pour: ${acceptedRequest.username}")
                        Toast.makeText(this@FriendsActivity, "${acceptedRequest.username}"+" "+getString(R.string.friendRequestAccepted), Toast.LENGTH_SHORT).show()
                        friendRequests.remove(acceptedRequest)
                        // Ajouter à friends
                        val newFriend = FriendItem.Friend(
                            userId = acceptedRequest.userId,
                            username = acceptedRequest.username
                        )
                        if (!friends.any { it.userId == newFriend.userId }) {
                            friends.add(newFriend)
                        }

                        Log.d("FriendsActivity", "Ajouté à friends : ${newFriend.username}")
                        Log.d("FriendsActivity", "friendRequests après suppression : $friendRequests")


                        removeUserFromAllPlayers(acceptedRequest.userId)

                        updateRequestBadge()
                        updateRecyclerView(friendRequests)
                    } else {
                        Log.e("FriendsActivity", "Aucune demande d'ami trouvée avec requestId: $requestId")
                    }
                } else {
                    Log.d("FriendsActivity", "Échec de l'acceptation de la demande.")
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors de l'acceptation de la demande d'ami: ${e.message}", e)
            }
        }
    }

    private fun handleRejectRequest(requestId: String) {
        Log.d("FriendsActivity", "handleRejectRequest appelé avec requestId: $requestId")
        lifecycleScope.launch {
            try {
                val rejectedRequest = friendRequests.find { it.requestId == requestId }
                Log.d("FriendsActivity", "Demande d'ami trouvée pour: ${rejectedRequest?.userId}")
                if (rejectedRequest != null) {
                    val success = withContext(Dispatchers.IO) { friendService.rejectFriendRequest(requestId) }
                    if (success) {
                        Toast.makeText(this@FriendsActivity, getString(R.string.friendRequestRejected), Toast.LENGTH_SHORT).show()

                        friendRequests.remove(rejectedRequest)
                        Log.d("FriendsActivity", "Demande d'ami rejetée pour ${rejectedRequest.username}")

                        transformFriendRequestToDiscoverPlayer(rejectedRequest.userId)

                        updateCurrentTabRecyclerView()
                    } else {
                        Log.e("FriendsActivity", "Échec du rejet de la demande.")
                    }
                } else {
                    Log.e("FriendsActivity", "Aucune demande trouvée avec requestId : $requestId")
                }
            } catch (e: Exception) {
                Log.e("FriendsActivity", "Erreur lors du rejet de la demande d'ami: ${e.message}", e)
            }
        }
    }
    private fun updateCurrentTabRecyclerView() {
        val dataToDisplay = when (currentTab) {
            "Friends" -> friends
            "Friend Requests" -> friendRequests
            "Discover Community" -> allPlayers
            else -> emptyList()
        }

        updateRecyclerView(dataToDisplay)
    }

}
