import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}

export function useJobs() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async (filters?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('date_recorded', { ascending: false })

      if (filters) {
        if (filters.technician) {
          query = query.eq('technician', filters.technician)
        }
        if (filters.date_from) {
          query = query.gte('date_recorded', filters.date_from)
        }
        if (filters.date_to) {
          query = query.lte('date_recorded', filters.date_to)
        }
        if (filters.type_serviced) {
          query = query.eq('type_serviced', filters.type_serviced)
        }
        if (filters.make_serviced) {
          query = query.eq('make_serviced', filters.make_serviced)
        }
        if (filters.min_amount) {
          query = query.gte('total_amount', filters.min_amount)
        }
        if (filters.max_amount) {
          query = query.lte('total_amount', filters.max_amount)
        }
        if (filters.is_oem_client !== undefined) {
          query = query.eq('is_oem_client', filters.is_oem_client)
        }
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setJobs(data || [])
      }
    } catch (err) {
      setError('Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }

  const createJob = async (jobData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()

      if (error) {
        setError(error.message)
        return { data: null, error }
      } else {
        setJobs(prev => [data[0], ...prev])
        return { data: data[0], error: null }
      }
    } catch (err) {
      setError('Failed to create job')
      return { data: null, error: 'Failed to create job' }
    } finally {
      setLoading(false)
    }
  }

  const updateJob = async (id: number, jobData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id)
        .select()

      if (error) {
        setError(error.message)
        return { data: null, error }
      } else {
        setJobs(prev => prev.map(job => job.id === id ? data[0] : job))
        return { data: data[0], error: null }
      }
    } catch (err) {
      setError('Failed to update job')
      return { data: null, error: 'Failed to update job' }
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (id: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)

      if (error) {
        setError(error.message)
        return { error }
      } else {
        setJobs(prev => prev.filter(job => job.id !== id))
        return { error: null }
      }
    } catch (err) {
      setError('Failed to delete job')
      return { error: 'Failed to delete job' }
    } finally {
      setLoading(false)
    }
  }

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
  }
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTechnicians = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name')

      if (error) {
        setError(error.message)
      } else {
        setTechnicians(data || [])
      }
    } catch (err) {
      setError('Failed to fetch technicians')
    } finally {
      setLoading(false)
    }
  }

  const createTechnician = async (technicianData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert([technicianData])
        .select()

      if (error) {
        setError(error.message)
        return { data: null, error }
      } else {
        setTechnicians(prev => [...prev, data[0]])
        return { data: data[0], error: null }
      }
    } catch (err) {
      setError('Failed to create technician')
      return { data: null, error: 'Failed to create technician' }
    } finally {
      setLoading(false)
    }
  }

  const updateTechnician = async (id: number, technicianData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('technicians')
        .update(technicianData)
        .eq('id', id)
        .select()

      if (error) {
        setError(error.message)
        return { data: null, error }
      } else {
        setTechnicians(prev => prev.map(tech => tech.id === id ? data[0] : tech))
        return { data: data[0], error: null }
      }
    } catch (err) {
      setError('Failed to update technician')
      return { data: null, error: 'Failed to update technician' }
    } finally {
      setLoading(false)
    }
  }

  return {
    technicians,
    loading,
    error,
    fetchTechnicians,
    createTechnician,
    updateTechnician,
  }
}

export function useJobMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async (technician?: string, dateRange?: { from: string; to: string }) => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('job_metrics')
        .select('*')
        .order('month', { ascending: false })

      if (technician) {
        query = query.eq('technician', technician)
      }

      if (dateRange?.from) {
        query = query.gte('month', dateRange.from)
      }

      if (dateRange?.to) {
        query = query.lte('month', dateRange.to)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setMetrics(data || [])
      }
    } catch (err) {
      setError('Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
  }
} 