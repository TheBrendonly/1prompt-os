-- Add CASCADE delete to simulation_personas -> simulations FK
ALTER TABLE public.simulation_personas DROP CONSTRAINT IF EXISTS simulation_personas_simulation_id_fkey;
ALTER TABLE public.simulation_personas ADD CONSTRAINT simulation_personas_simulation_id_fkey 
  FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;

-- Add CASCADE delete to simulation_messages -> simulation_personas FK
ALTER TABLE public.simulation_messages DROP CONSTRAINT IF EXISTS simulation_messages_persona_id_fkey;
ALTER TABLE public.simulation_messages ADD CONSTRAINT simulation_messages_persona_id_fkey 
  FOREIGN KEY (persona_id) REFERENCES public.simulation_personas(id) ON DELETE CASCADE;