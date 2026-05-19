export type CobliApiResponse = {
  content?: CobliRouteRaw[]
  total_elements?: number
  total_pages?: number
  number_of_elements?: number
}

export type CobliActivityRaw = {
  id?: string
  type?: string
  status?: string
  visit_status?: string | null
  completion_status?: string | null
  position?: number
  name?: string | null
  phone_number?: string | null
  additional_info?: string | null
  time_windows?:
    | {
        earliest: number
        latest: number
      }[]
    | null
  start_time?: number | null
  end_time?: number | null
  arrival_time?: number | null
  executed_end_time?: number | null
  driver_name?: string | null
  destination?: {
    city?: string
    state?: string
    neighborhood?: string | null
    street_address?: string
    street_number?: string
    postal_code?: string
    country?: string
  } | null
}

export type CobliRouteRaw = {
  id?: string
  name?: string | null
  status?: string
  start_time?: number
  end_time?: number
  executed_start_time?: number
  executed_end_time?: number
  created_at?: number
  updated_at?: number
  driver_id?: string | null
  driver_name?: string | null
  vehicle_id?: string | null
  shared_id?: string | null
  points?: { latitude: number; longitude: number }[]
  activities?: CobliActivityRaw[]
}

export type CobliActivity = {
  id: string
  type: string
  status: string
  visit_status: string | null
  completion_status: string | null
  position: number
  name?: string | null
  phone_number?: string | null
  additional_info?: string | null
  time_windows:
    | {
        earliest: number
        latest: number
      }[]
    | null
  start_time: number | null
  end_time: number | null
  arrival_time: number | null
  executed_end_time: number | null
  driver_name: string | null
  destination: {
    city?: string
    state?: string
    neighborhood?: string | null
    street_address?: string
    street_number?: string
    postal_code?: string
    country?: string
  } | null
}

export type NormalizedRoute = {
  id: string
  name: string
  status: string
  startTimeLabel: string
  endTimeLabel: string
  driverName: string
  routeDate?: string
  activities: CobliActivity[]
  points: { latitude: number; longitude: number }[]
}