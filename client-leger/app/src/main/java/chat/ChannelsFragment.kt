package chat

import constants.ChatRoomType
import com.services.ChatSocketService
import android.content.Context
import android.os.Bundle
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.auth0.androidlogin.ChatFragment
import com.auth0.androidlogin.R
import interfaces.ChatRoomInfo

class ChannelsFragment : Fragment() {

    private lateinit var chatService: ChatSocketService
    private lateinit var buttonContainer: LinearLayout // Container for buttons
    private lateinit var generalButton: Button
    val chatSocket : ChatSocketService = ChatSocketService
    var userName: String? = null
    private lateinit var addToListButton: ImageButton
    private lateinit var channelNameEditText: EditText
    private lateinit var editChannelsButton: ImageButton
    private var createNewChannelView: View? = null
    private lateinit var searchChannelButton: ImageButton
    private var searchChannelView: View? = null
    private var currentActiveView: View? = null
    private var filteredChannelsList = ArrayList<String>()


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.all_channels_page, container, false)
        this.chatService = ChatSocketService
        val createNewChannelView = inflater.inflate(R.layout.create_new_channel_display, container, false)

        generalButton = view.findViewById(R.id.generalButton)
        val exitButton : ImageButton = view.findViewById(R.id.exitButton)
        val addChannelButton : ImageButton = view.findViewById(R.id.addChannelButton)
        buttonContainer = view.findViewById(R.id.channelLinearLayout)
        searchChannelButton = view.findViewById(R.id.searchChannelsButton)
        editChannelsButton = view.findViewById(R.id.editChannelsButton)
        channelNameEditText = createNewChannelView.findViewById(R.id.channelNameEditText)
        addToListButton = createNewChannelView.findViewById(R.id.addToListButton)

        // resetChannelButtons()

        exitButton.setOnClickListener {
            chatSocket.toggleChat()
        }

        addChannelButton.setOnClickListener {
            toggleCreateNewChannelView(view)
        }

        editChannelsButton.setOnClickListener {
            toggleEditableChannels()
        }

        searchChannelButton.setOnClickListener {
            toggleSearchChannelView(view)
        }

        arguments?.let {
            this.userName = it.getString("USER_NAME")
        }

        this.chatService.joinedChatRoomsSubject.observe(viewLifecycleOwner) { resetChannelButtons() }

        this.chatService.channelsSubject.observe(viewLifecycleOwner) { resetChannelButtons() }

        return view
    }

    private fun navigateToChat(chatRoom: String) {
        val chatFragment = ChatFragment()
        chatSocket.selectChatRoom(chatRoom)
        val bundle = Bundle()
        bundle.putString("CHANNEL_NAME", chatRoom)
        bundle.putString("USER_NAME", this.userName)
        chatFragment.arguments = bundle

        val transaction = parentFragmentManager.beginTransaction()
        transaction.replace(R.id.channelsContainer, chatFragment)
        transaction.addToBackStack(null)
        transaction.commit()
    }

    private fun displayEditableChannels() {
        if(chatService.channelsSubject.value == null)
            return
        buttonContainer.removeAllViews()
        for (channel in chatService.joinedChatRooms.value!!) {
            val channelView = LayoutInflater.from(context).inflate(R.layout.channel_button_delete, buttonContainer, false)

            val channelTextView: TextView = channelView.findViewById(R.id.channelTextView)
            val deleteChannelButton: ImageButton = channelView.findViewById(R.id.deleteChannelButton)
            channelTextView.text = channel.chatRoomName

            // Disable delete for the "General" channel
            if (channel.chatRoomName == "general") {
                deleteChannelButton.visibility = View.GONE
            } else {
                deleteChannelButton.setOnClickListener {
                    this.chatService.removeChannel(channel.chatRoomName)
                    Toast.makeText(requireContext(), getString(R.string.leftChannel)+ channel.chatRoomName, Toast.LENGTH_SHORT)
                        .show()
                    currentActiveView = null
                }
            }
            buttonContainer.addView(channelView)
        }
    }

    private fun toggleEditableChannels() {
        if (currentActiveView == buttonContainer) {
            hideAllViews()
        } else {
            hideAllViews()
            displayEditableChannels()
            currentActiveView = buttonContainer
        }
    }

    private fun toggleCreateNewChannelView(view: View) {
        val channelsFragment: LinearLayout = view.findViewById(R.id.channels_fragment) ?: return

        if (createNewChannelView == null) {
            createNewChannelView = LayoutInflater.from(requireContext())
                .inflate(R.layout.create_new_channel_display, channelsFragment, false)

            val scrollViewPosition = channelsFragment.indexOfChild(view.findViewById(R.id.channelScrollView))
            channelsFragment.addView(createNewChannelView, scrollViewPosition)

            addToListButton = createNewChannelView!!.findViewById(R.id.addToListButton)
            channelNameEditText = createNewChannelView!!.findViewById(R.id.channelNameEditText)

            channelNameEditText.filters = arrayOf(InputFilter.LengthFilter(10))

            val charCount = TextView(requireContext()).apply {
                text = "0/10"
                setTextColor(android.graphics.Color.GRAY)
                textSize = 12f
            }
            (createNewChannelView as ViewGroup).addView(charCount)

            channelNameEditText.addTextChangedListener(object : TextWatcher {
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    val currentLength = s?.length ?: 0
                    charCount.text = "$currentLength/10"

                    // Show toast when character limit is reached
                    if (currentLength >= 10) {
                        Toast.makeText(requireContext(), getString(R.string.limitChannelName), Toast.LENGTH_SHORT).show()
                    }
                }

                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun afterTextChanged(s: Editable?) {}
            })

            addToListButton.setOnClickListener {
                addNewChannelToList()
            }

            channelNameEditText.setOnEditorActionListener { _, actionId, _ ->
                if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_DONE) {
                    addNewChannelToList()
                    true
                } else {
                    false
                }
            }
        }
        if (currentActiveView == createNewChannelView) {
            createNewChannelView!!.visibility = View.GONE
            hideKeyboard(channelNameEditText)
            currentActiveView = null
        } else {
            hideAllViews()
            createNewChannelView!!.visibility = View.VISIBLE
            channelNameEditText.requestFocus()
            showKeyboard(channelNameEditText)
            currentActiveView = createNewChannelView
        }
    }

    private fun addNewChannelToList() {
        channelNameEditText.filters = arrayOf(InputFilter.LengthFilter(10))
        channelNameEditText.addTextChangedListener(object : TextWatcher {
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (s != null && s.length == 10) {
                    Toast.makeText(requireContext(), getString(R.string.limitChannelName), Toast.LENGTH_SHORT).show()
                }
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun afterTextChanged(s: Editable?) {}
        })
        if(chatService.channelsSubject.value == null)
            return
        val channelName = channelNameEditText.text.toString()

        if (channelName.isNotBlank()) {
            if (chatService.channelsSubject.value!!.any { it.equals(channelName, ignoreCase = true) }) {
                Toast.makeText(requireContext(), getString(R.string.channelNameExists), Toast.LENGTH_SHORT).show()
            } else {
                this.chatService.createChannel(ChatRoomInfo(channelName, ChatRoomType.Public))

                hideKeyboard(channelNameEditText)
                channelNameEditText.text.clear()
                createNewChannelView?.visibility = View.GONE
                currentActiveView = null
                Toast.makeText(requireContext(), getString(R.string.channel) + channelName + getString(R.string.successCreationChannel), Toast.LENGTH_SHORT).show()
            }
        }else {
            Toast.makeText(requireContext(), getString(R.string.emptyChannelName), Toast.LENGTH_SHORT)
                .show()
        }
    }

    private fun resetChannelButtons() {
        if (this.chatService.joinedChatRooms.value == null)
            return
        buttonContainer.removeAllViews()
        Log.d("ChannelFragment", chatService.joinedChatRooms.value!!.size.toString())
        for (channelName in this.chatService.joinedChatRooms.value!!) {
            val channelView = LayoutInflater.from(context)
                .inflate(R.layout.channel_button_original, buttonContainer, false)
            val channelButton = channelView.findViewById<TextView>(R.id.channelButton)
            val redCircle = channelView.findViewById<TextView>(R.id.red_circle)

            channelButton.text = channelName.chatRoomName
            channelButton.setOnClickListener {
                createNewChannelView = null
                navigateToChat(channelName.chatRoomName)
            }
            val unreadMessagesCount = chatService.getUnreadMessageCount(channelName) // Replace this with actual logic to fetch unread messages count
            redCircle.text = unreadMessagesCount.toString()
            redCircle.visibility = if (unreadMessagesCount.toInt() > 0) View.VISIBLE else View.GONE
            buttonContainer.addView(channelView)
        }
    }

    private fun filterChannels(searchTerm: String) {
        filteredChannelsList.clear()

        if (searchTerm.isEmpty()) {
            chatService.channelsSubject.value?.let { filteredChannelsList.addAll(it) }
        } else {
            chatService.channelsSubject.value?.let {
                filteredChannelsList.addAll(
                    it.filter { it.lowercase().contains(searchTerm) }
                )
            }
        }
        updateChannelDisplay()
    }

    private fun updateChannelDisplay() {
        buttonContainer.removeAllViews()
        val layoutToUse = R.layout.channel_button_search

        for (channelName in filteredChannelsList) {
            val channelView = LayoutInflater.from(context)
                .inflate(layoutToUse, buttonContainer, false)

            val channelTextView: TextView = channelView.findViewById(R.id.channelName)
            val joinButton: Button = channelView.findViewById(R.id.joinChannelButton)
            channelTextView.text = channelName

            if (null != this.chatService.joinedChatRooms.value!!.find{c -> c.chatRoomName == channelName}) {
                joinButton.text = getString(R.string.joined)
                joinButton.isEnabled = false
                joinButton.setBackgroundColor(resources.getColor(android.R.color.darker_gray))
            } else {
                joinButton.text = getString(R.string.joinChannel)
                joinButton.isEnabled = true
                joinButton.setOnClickListener {
                    this.chatService.joinChannel(channelName)
                    joinButton.text = getString(R.string.joined)
                    joinButton.isEnabled = false
                    joinButton.setBackgroundColor(resources.getColor(android.R.color.darker_gray))
                    Toast.makeText(requireContext(), getString(R.string.joinedChannel) +channelName, Toast.LENGTH_SHORT).show()
                }
            }
            buttonContainer.addView(channelView)
        }
    }

    private fun toggleSearchChannelView(view: View) {
        val channelsFragment: LinearLayout = view.findViewById(R.id.channels_fragment)

        if (searchChannelView == null) {
            searchChannelView = LayoutInflater.from(requireContext()).inflate(R.layout.search_channel_display, channelsFragment, false)

            val scrollViewPosition = channelsFragment.indexOfChild(view.findViewById(R.id.channelScrollView))
            channelsFragment.addView(searchChannelView, scrollViewPosition)

            val channelNameSearchText: EditText = searchChannelView!!.findViewById(R.id.channelNameSearchText)
            val searchChannelButton: ImageButton = searchChannelView!!.findViewById(R.id.searchChannelButton)

            searchChannelButton.setOnClickListener {
                val searchTerm = channelNameSearchText.text.toString().lowercase()
                filterChannels(searchTerm)
            }

            channelNameSearchText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    val searchTerm = s.toString().lowercase()
                    filterChannels(searchTerm)
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
        if (currentActiveView == searchChannelView) {
            // Si la vue de recherche est déjà active, on la cache
            searchChannelView?.visibility = View.GONE
            hideKeyboard(searchChannelView!!)
            resetChannelButtons()
            currentActiveView = null
        } else {
            hideAllViews()
            searchChannelView?.visibility = View.VISIBLE
            val channelNameSearchText: EditText = searchChannelView!!.findViewById(R.id.channelNameSearchText)
            channelNameSearchText.requestFocus()
            showKeyboard(channelNameSearchText)
            filteredChannelsList.clear()
            chatService.channelsSubject.value?.let { filteredChannelsList.addAll(it) }
            updateChannelDisplay()
            currentActiveView = searchChannelView
        }
    }

    private fun hideAllViews() {
        createNewChannelView?.let {
            it.visibility = View.GONE
            val addChannelEditText: EditText = it.findViewById(R.id.channelNameEditText)
            addChannelEditText.text.clear()
            hideKeyboard(addChannelEditText)
        }

        searchChannelView?.let {
            it.visibility = View.GONE
            val searchChannelEditText: EditText = it.findViewById(R.id.channelNameSearchText)
            searchChannelEditText.text.clear()
            hideKeyboard(searchChannelEditText)
        }

        resetChannelButtons()
        currentActiveView = null
    }

    // Keyboard handling
    private fun showKeyboard(editText: EditText) {
        val imm = requireContext().getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.showSoftInput(editText, InputMethodManager.SHOW_IMPLICIT)
    }
    private fun hideKeyboard(view: View) {
        val imm = requireContext().getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(view.windowToken, 0)
    }


}
