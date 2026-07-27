import { supabase } from "@/lib/supabase";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  instructions: string | null;
  created_at: string;
}

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from("exercises").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function searchExercises(query: string, muscleGroup?: string): Promise<Exercise[]> {
  let request = supabase.from("exercises").select("*").order("name");
  if (query.trim()) request = request.ilike("name", `%${query.trim()}%`);
  if (muscleGroup) request = request.eq("muscle_group", muscleGroup);
  const { data, error } = await request;
  if (error) throw error;
  return data ?? [];
}
