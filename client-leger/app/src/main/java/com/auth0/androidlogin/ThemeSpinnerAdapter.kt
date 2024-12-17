package com.auth0.androidlogin

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ImageView
import android.widget.TextView
import com.auth0.androidlogin.models.ThemeOption

class ThemeSpinnerAdapter(context: Context, private val themes: List<ThemeOption>) :
    ArrayAdapter<ThemeOption>(context, 0, themes) {

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        val view = convertView ?: LayoutInflater.from(context)
            .inflate(R.layout.spinner_selected_item, parent, false)

        val themeOption = getItem(position)
        val textView = view.findViewById<TextView>(R.id.textViewName)

        textView.text = themeOption?.displayName

        return view    }

    override fun getDropDownView(position: Int, convertView: View?, parent: ViewGroup): View {
        return createViewFromResource(position, convertView, parent)
    }

    private fun createViewFromResource(position: Int, convertView: View?, parent: ViewGroup): View {
        val view = convertView ?: LayoutInflater.from(context)
            .inflate(R.layout.item_theme_spinner, parent, false)

        val themeOption = getItem(position)
        val textView = view.findViewById<TextView>(R.id.textViewThemeName)
        val imageViewLock = view.findViewById<ImageView>(R.id.imageViewLock)

        textView.text = themeOption?.displayName
        imageViewLock.visibility = if (themeOption?.isOwned == true) View.GONE else View.VISIBLE

        return view
    }
}
