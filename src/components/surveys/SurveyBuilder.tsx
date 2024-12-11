import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['text', 'multiple_choice', 'rating']),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
})

const surveySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
})

type SurveyFormData = z.infer<typeof surveySchema>

interface SurveyBuilderProps {
  onSubmit: (data: SurveyFormData) => Promise<void>
  initialData?: SurveyFormData
}

export default function SurveyBuilder({ onSubmit, initialData }: SurveyBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      isTemplate: false,
      questions: [{ text: '', type: 'text', required: true }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  })

  const onSubmitForm = async (data: SurveyFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      toast.success('Survey saved successfully!')
    } catch (error) {
      toast.error('Failed to save survey')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
          <input
            type="text"
            {...register('title')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
          <textarea
            {...register('description')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
      </div>

      <div>
        <label className="flex items-center text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            {...register('isTemplate')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2">Save as template</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Questions</h3>
          <Button
            type="button"
            onClick={() => append({ text: '', type: 'text', required: true })}
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-4">
            <div className="flex justify-between">
              <h4 className="font-medium">Question {index + 1}</h4>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question Text
                <input
                  type="text"
                  {...register(`questions.${index}.text`)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
              {errors.questions?.[index]?.text && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.questions[index]?.text?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Question Type
                <select
                  {...register(`questions.${index}.type`)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="rating">Rating</option>
                </select>
              </label>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  {...register(`questions.${index}.required`)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Required</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Save Survey
        </Button>
      </div>
    </form>
  )
}
