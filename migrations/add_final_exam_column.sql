-- Migration: Add final_exam column and rename score to semi_final
-- This migration adds a new final_exam column and renames the existing score column to semi_final

-- First, add the new final_exam column
ALTER TABLE public.students 
ADD COLUMN final_exam integer;

-- Rename the existing score column to semi_final
ALTER TABLE public.students 
RENAME COLUMN score TO semi_final;

-- Add comments to describe the columns
COMMENT ON COLUMN public.students.semi_final IS 'Semi-final examination score';
COMMENT ON COLUMN public.students.final_exam IS 'Final examination score';

-- Update the updated_at timestamp for all records to reflect the schema change
UPDATE public.students 
SET updated_at = NOW();
