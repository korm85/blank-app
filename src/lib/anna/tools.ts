import type Anthropic from '@anthropic-ai/sdk'

// Tool names and fields match the source spec exactly.
export const ANNA_TOOLS: Anthropic.Tool[] = [
  {
    name: 'set_weekly_schedule',
    description:
      'Записывает два дня недели и время, когда Мила хочет заниматься. Вызывай при онбординге ' +
      'или когда Мила сама просит поменять расписание целиком.',
    input_schema: {
      type: 'object',
      properties: {
        day_1: { type: 'string', description: 'Первый день недели по-русски, например "вторник"' },
        time_1: { type: 'string', description: 'Время первого дня в формате ЧЧ:ММ, например "11:00"' },
        day_2: { type: 'string', description: 'Второй день недели по-русски, например "пятница"' },
        time_2: { type: 'string', description: 'Время второго дня в формате ЧЧ:ММ, например "16:00"' },
        duration_minutes: { type: 'number', description: 'Длительность тренировки в минутах' },
      },
      required: ['day_1', 'time_1', 'day_2', 'time_2', 'duration_minutes'],
      additionalProperties: false,
    },
  },
  {
    name: 'delay_workout_today',
    description:
      'Переносит сегодняшнюю тренировку на 1-3 часа позже в тот же день. Вызывай только после ' +
      'того, как Мила согласилась на конкретное новое время.',
    input_schema: {
      type: 'object',
      properties: {
        delay_hours: { type: 'number', description: 'На сколько часов отложить (1-3)' },
        new_time: { type: 'string', description: 'Новое время в формате ЧЧ:ММ' },
      },
      required: ['delay_hours', 'new_time'],
      additionalProperties: false,
    },
  },
  {
    name: 'reschedule_workout_day',
    description:
      'Переносит сегодняшнюю тренировку на другой день той же недели. Вызывай только после того, ' +
      'как Мила согласилась на конкретный новый день.',
    input_schema: {
      type: 'object',
      properties: {
        original_day: { type: 'string', description: 'Исходный день недели по-русски' },
        new_day: { type: 'string', description: 'Новый день недели по-русски' },
        new_time: { type: 'string', description: 'Время в новый день, формат ЧЧ:ММ' },
      },
      required: ['original_day', 'new_day', 'new_time'],
      additionalProperties: false,
    },
  },
  {
    name: 'log_workout_completed',
    description: 'Отмечает, что Мила выполнила сегодняшнюю тренировку.',
    input_schema: {
      type: 'object',
      properties: {
        increment_count: { type: 'number', description: 'Всегда 1' },
        weekly_goal: { type: 'number', description: 'Всегда 2' },
      },
      required: ['increment_count', 'weekly_goal'],
      additionalProperties: false,
    },
  },
]
