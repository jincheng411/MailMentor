import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error(
    'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file'
  );
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, API calls should go through your backend
});

export async function generateEmailReply(
  emailContent: string,
  tone: 'formal' | 'casual' | 'technical'
): Promise<string> {
  try {
    const prompt = `Please write a professional email reply with a ${tone} tone to the following email:\n\n${emailContent}\n\nReply:`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a professional email assistant. Write replies that are:
            - Clear and concise
            - Professional and courteous
            - Appropriate for business communication
            - In a ${tone} tone
            - Without any unnecessary pleasantries
            - Focused on addressing the key points`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'gpt-3.5-turbo',
    });

    return (
      completion.choices[0]?.message?.content ||
      'Sorry, I could not generate a reply.'
    );
  } catch (error) {
    console.error('Error generating email reply:', error);
    throw new Error('Failed to generate email reply');
  }
}
