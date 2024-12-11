import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

interface Question {
  id: string
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'rating'
  options?: string[]
  required: boolean
}

interface FeedbackFormProps {
  surveyId: string
  questions: Question[]
  onSubmit: (answers: Record<string, any>) => Promise<void>
}

export default function FeedbackForm({ surveyId, questions, onSubmit }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dynamically generate validation schema based on questions
  const validationSchema = z.object(
    questions.reduce((acc, q) => {
      let fieldSchema = z.any()
      if (q.question_type === 'rating') {
        fieldSchema = z.number().min(1).max(5)
      } else if (q.question_type === 'multiple_choice') {
        fieldSchema = z.string()
      } else {
        fieldSchema = z.string()
      }
      
      return {
        ...acc,
        [q.id]: q.required ? fieldSchema : fieldSchema.optional(),
      }
    }, {})
  )

  type FormData = z.infer<typeof validationSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
  })

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      toast.success('Feedback submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit feedback')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {questions.map((question) => (
        <div key={question.id} className="border rounded-md p-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              {question.question_text}
              {question.required && <span className="text-red-500">*</span>}
            </span>

            {question.question_type === 'text' && (
              <textarea
                {...register(question.id)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            )}

            {question.question_type === 'multiple_choice' && (
              <div className="mt-2 space-y-2">
                {question.options?.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      {...register(question.id)}
                      value={option}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'rating' && (
              <div className="mt-2">
                <div className="flex space-x-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        {...register(question.id, { valueAsNumber: true })}
                        value={value}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mt-1 text-sm text-gray-500">{value}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            )}
          </label>

          {errors[question.id] && (
            <p className="mt-1 text-sm text-red-600">
              This field is required
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Submit Feedback
        </Button>
      </div>
    </form>
  )
}
