package classes

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.models.Session
import com.auth0.androidlogin.R

class ConnectionHistoryAdapter : RecyclerView.Adapter<ConnectionHistoryAdapter.ConnectionViewHolder>() {

    private val sessions = mutableListOf<Session>()

    // Method to update the adapter's data
    fun setData(data: List<Session>) {
        sessions.clear()
        sessions.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ConnectionViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_connection_history, parent, false)
        return ConnectionViewHolder(view)
    }

    override fun onBindViewHolder(holder: ConnectionViewHolder, position: Int) {
        holder.bind(sessions[position])
    }

    override fun getItemCount(): Int = sessions.size

    inner class ConnectionViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val signInTypeTextView: TextView = itemView.findViewById(R.id.signInTypeTextView)
        private val signInDateTimeTextView: TextView = itemView.findViewById(R.id.signInDateTimeTextView)
        private val signOutTypeTextView: TextView = itemView.findViewById(R.id.signOutTypeTextView)
        private val signOutDateTimeTextView: TextView = itemView.findViewById(R.id.signOutDateTimeTextView)

        fun bind(session: Session) {
            // Set Signin data
            signInTypeTextView.text = itemView.context.getString(R.string.button_login)
            signInDateTimeTextView.text = session.loginAt

            // Set Signout data
            signOutTypeTextView.text = itemView.context.getString(R.string.button_logout)
            signOutDateTimeTextView.text = session.logoutAt
        }
    }
}
