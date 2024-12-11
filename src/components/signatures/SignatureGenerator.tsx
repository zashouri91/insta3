import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const signatureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  customText: z.string().optional(),
})

type SignatureFormData = z.infer<typeof signatureSchema>

interface SignatureGeneratorProps {
  onSave: (htmlContent: string) => Promise<void>
  initialData?: {
    name: string
    title: string
    email: string
    phone?: string
    company?: string
  }
}

export default function SignatureGenerator({ onSave, initialData }: SignatureGeneratorProps) {
  const [previewHtml, setPreviewHtml] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignatureFormData>({
    resolver: zodResolver(signatureSchema),
    defaultValues: initialData,
  })

  const formValues = watch()

  useEffect(() => {
    // Generate HTML preview whenever form values change
    const html = generateSignatureHtml(formValues)
    setPreviewHtml(html)
  }, [formValues])

  const onSubmit = async (data: SignatureFormData) => {
    try {
      setIsSaving(true)
      const html = generateSignatureHtml(data)
      await onSave(html)
      toast.success('Signature saved successfully!')
    } catch (error) {
      toast.error('Failed to save signature')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Email Signature Details</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

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
              Email
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone (optional)
              <input
                type="tel"
                {...register('phone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company (optional)
              <input
                type="text"
                {...register('company')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Text (optional)
              <textarea
                {...register('customText')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </label>
          </div>

          <div className="pt-4">
            <Button type="submit" isLoading={isSaving}>
              Save Signature
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Preview</h3>
        <div className="border rounded-md p-4 bg-white">
          <div
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            className="prose max-w-none"
          />
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(previewHtml)
              toast.success('Signature copied to clipboard!')
            }}
          >
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </div>
  )
}

function generateSignatureHtml(data: SignatureFormData): string {
  return `
    <table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; color: #333333;">
      <tr>
        <td style="padding-bottom: 10px;">
          <strong style="font-size: 16px; color: #000000;">${data.name}</strong>
          ${data.title ? `<br /><span style="color: #666666;">${data.title}</span>` : ''}
          ${data.company ? `<br /><span style="color: #666666;">${data.company}</span>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px;">
          ${data.email ? `<a href="mailto:${data.email}" style="color: #0066cc; text-decoration: none;">${data.email}</a>` : ''}
          ${data.phone ? `<br /><span style="color: #666666;">${data.phone}</span>` : ''}
        </td>
      </tr>
      ${data.customText ? `
        <tr>
          <td style="padding-top: 10px; border-top: 1px solid #dddddd;">
            <span style="color: #666666; font-style: italic;">${data.customText}</span>
          </td>
        </tr>
      ` : ''}
    </table>
  `
}
