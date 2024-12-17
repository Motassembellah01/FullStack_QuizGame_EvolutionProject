package com.auth0.androidlogin

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.TextView
import com.auth0.androidlogin.models.LanguageOption

class LangSpinnerAdapter(
    context: Context,
    private val languages: List<LanguageOption>
) : ArrayAdapter<LanguageOption>(context, 0, languages) {

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        // Inflate the selected item layout
        val view = convertView ?: LayoutInflater.from(context)
            .inflate(R.layout.spinner_selected_item, parent, false)

        val languageOption = getItem(position)
        val textView = view.findViewById<TextView>(R.id.textViewName)

        textView.text = languageOption?.displayName

        return view
    }

    override fun getDropDownView(position: Int, convertView: View?, parent: ViewGroup): View {
        // Inflate the dropdown item layout
        val view = convertView ?: LayoutInflater.from(context)
            .inflate(R.layout.item_language_spinner, parent, false)

        val languageOption = getItem(position)
        val textView = view.findViewById<TextView>(R.id.textViewLangName)

        textView.text = languageOption?.displayName

        return view
    }
}
