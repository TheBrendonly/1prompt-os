-- Ensure system_prompt column exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='clients' AND column_name='system_prompt'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN system_prompt text;
  END IF;
END $$;

-- Define the new default system prompt template
DO $$
BEGIN
  -- Set default value for new rows
  EXECUTE $$
    ALTER TABLE public.clients 
    ALTER COLUMN system_prompt SET DEFAULT $DEFAULT_PROMPT$
# [PROMPT TITLE]

## ROLE DEFINITION

You are [specific role/identity with expertise level]. [2-3 sentences defining personality, approach, and core competencies]

## PRIMARY OBJECTIVE

[Single, clear statement of the main goal this prompt should achieve]

## KEY RESPONSIBILITIES

1. [Specific responsibility 1]
2. [Specific responsibility 2]
3. [Specific responsibility 3]
4. [Specific responsibility 4]

## KNOWLEDGE BASE

### [Domain Area 1]
[Relevant information, rules, standards, or context for this area]

### [Domain Area 2]
[Relevant information, rules, standards, or context for this area]

## OPERATIONAL GUIDELINES

### Input Processing
- [How to handle user inputs]
- [What to prioritize or focus on]
- [Any specific analysis requirements]

### Output Requirements
- [Specific format specifications]
- [Quality standards and criteria]
- [Length, style, or structure requirements]

### Quality Controls
- [Validation methods]
- [Consistency requirements]
- [Error prevention measures]

## COMMUNICATION STYLE

- **Tone:** [Professional/casual/technical/etc.]
- **Language Level:** [Expert/intermediate/beginner-friendly]
- **Approach:** [Methodical/creative/analytical/etc.]
- **Restrictions:** [What to avoid or not include]

## SUCCESS CRITERIA

- [Measurable outcome 1]
- [Measurable outcome 2]
- [Quality indicator 1]
- [Quality indicator 2]

## CONSTRAINTS & LIMITATIONS

- [Boundary 1]
- [Boundary 2]
- [Safety consideration]
- [Scope limitation]
$DEFAULT_PROMPT$;
  $$;

  -- Update existing rows that have no custom system_prompt or still have the legacy default text
  UPDATE public.clients
  SET system_prompt = $DEFAULT_PROMPT$
# [PROMPT TITLE]

## ROLE DEFINITION

You are [specific role/identity with expertise level]. [2-3 sentences defining personality, approach, and core competencies]

## PRIMARY OBJECTIVE

[Single, clear statement of the main goal this prompt should achieve]

## KEY RESPONSIBILITIES

1. [Specific responsibility 1]
2. [Specific responsibility 2]
3. [Specific responsibility 3]
4. [Specific responsibility 4]

## KNOWLEDGE BASE

### [Domain Area 1]
[Relevant information, rules, standards, or context for this area]

### [Domain Area 2]
[Relevant information, rules, standards, or context for this area]

## OPERATIONAL GUIDELINES

### Input Processing
- [How to handle user inputs]
- [What to prioritize or focus on]
- [Any specific analysis requirements]

### Output Requirements
- [Specific format specifications]
- [Quality standards and criteria]
- [Length, style, or structure requirements]

### Quality Controls
- [Validation methods]
- [Consistency requirements]
- [Error prevention measures]

## COMMUNICATION STYLE

- **Tone:** [Professional/casual/technical/etc.]
- **Language Level:** [Expert/intermediate/beginner-friendly]
- **Approach:** [Methodical/creative/analytical/etc.]
- **Restrictions:** [What to avoid or not include]

## SUCCESS CRITERIA

- [Measurable outcome 1]
- [Measurable outcome 2]
- [Quality indicator 1]
- [Quality indicator 2]

## CONSTRAINTS & LIMITATIONS

- [Boundary 1]
- [Boundary 2]
- [Safety consideration]
- [Scope limitation]
$DEFAULT_PROMPT$
  WHERE system_prompt IS NULL
     OR system_prompt LIKE '# AI Prompt Engineering Assistant%';
END $$;