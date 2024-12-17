package classes

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.auth0.androidlogin.databinding.ItemQuestionBinding
import com.auth0.androidlogin.models.IQuestion

class QuestionAdapter(
    private val questions: MutableList<IQuestion>
) : RecyclerView.Adapter<QuestionAdapter.QuestionViewHolder>() {

    inner class QuestionViewHolder(private val binding: ItemQuestionBinding) :
        RecyclerView.ViewHolder(binding.root) {
        fun bind(question: IQuestion) {
            binding.questionTextView.text = question.text
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuestionViewHolder {
        val binding = ItemQuestionBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return QuestionViewHolder(binding)
    }

    override fun onBindViewHolder(holder: QuestionViewHolder, position: Int) {
        holder.bind(questions[position])
    }

    override fun getItemCount(): Int = questions.size

    fun addQuestions(newQuestions: List<IQuestion>) {
        val startPosition = questions.size
        questions.addAll(newQuestions)
        notifyItemRangeInserted(startPosition, newQuestions.size)
    }
}
