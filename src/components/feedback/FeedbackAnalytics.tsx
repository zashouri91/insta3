import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import Button from '../ui/Button'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface AnalyticsData {
  question: string
  type: string
  totalResponses: number
  analytics: any // Type varies based on question type
}

interface FeedbackAnalyticsProps {
  surveyId: string
  data: AnalyticsData[]
  onRefresh: () => Promise<void>
}

export default function FeedbackAnalytics({ surveyId, data, onRefresh }: FeedbackAnalyticsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'responses' | 'average'>('responses')

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feedback Analytics</h2>
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing}
          variant="secondary"
        >
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Responses"
          value={data[0]?.totalResponses || 0}
        />
        <MetricCard
          title="Questions"
          value={data.length}
        />
        <MetricCard
          title="Average Rating"
          value={calculateAverageRating(data)}
          decimals={1}
        />
      </div>

      <div className="space-y-6">
        {data.map((item, index) => (
          <QuestionAnalytics
            key={index}
            data={item}
            selectedMetric={selectedMetric}
          />
        ))}
      </div>
    </div>
  )
}

function MetricCard({ title, value, decimals = 0 }: {
  title: string
  value: number
  decimals?: number
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold">
        {value.toFixed(decimals)}
      </p>
    </div>
  )
}

function QuestionAnalytics({ data, selectedMetric }: {
  data: AnalyticsData
  selectedMetric: 'responses' | 'average'
}) {
  const chartData = generateChartData(data, selectedMetric)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">{data.question}</h3>
      {data.type === 'rating' || data.type === 'multiple_choice' ? (
        <div className="h-64">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="text-gray-500 italic">
          Text responses cannot be visualized in a chart
        </div>
      )}
    </div>
  )
}

function generateChartData(data: AnalyticsData, metric: 'responses' | 'average') {
  if (data.type === 'rating') {
    const distribution = data.analytics.distribution
    return {
      labels: Object.keys(distribution),
      datasets: [
        {
          label: 'Responses',
          data: Object.values(distribution),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    }
  }

  if (data.type === 'multiple_choice') {
    return {
      labels: Object.keys(data.analytics),
      datasets: [
        {
          label: 'Responses',
          data: Object.values(data.analytics),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    }
  }

  return {
    labels: [],
    datasets: [],
  }
}

function calculateAverageRating(data: AnalyticsData[]): number {
  const ratingQuestions = data.filter(q => q.type === 'rating')
  if (ratingQuestions.length === 0) return 0

  const totalAverage = ratingQuestions.reduce((sum, q) => sum + q.analytics.average, 0)
  return totalAverage / ratingQuestions.length
}
