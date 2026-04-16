-- Set default value for system_prompt column
ALTER TABLE public.clients 
ALTER COLUMN system_prompt SET DEFAULT '# [PROMPT TITLE]

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
- [Scope limitation]';

-- Update existing clients that have NULL or old default system_prompt
UPDATE public.clients
SET system_prompt = '# [PROMPT TITLE]

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
- [Scope limitation]'
WHERE system_prompt IS NULL 
   OR system_prompt LIKE '# AI Prompt Engineering Assistant%';