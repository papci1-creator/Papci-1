import { Scene } from '../types';

export interface GoogleDriveFormFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleFormItem {
  itemId: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
      textQuestion?: { paragraph?: boolean };
      choiceQuestion?: { type: string; options: { value: string }[] };
      scaleQuestion?: { low: number; high: number; lowLabel?: string; highLabel?: string };
    };
  };
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  revisionId?: string;
  items?: GoogleFormItem[];
}

export interface GoogleFormResponseAnswer {
  questionId: string;
  textAnswers?: { answers: { value: string }[] };
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<string, GoogleFormResponseAnswer>;
}

export interface GoogleFormResponsesResult {
  responses?: GoogleFormResponse[];
  totalResponses?: number;
}

/**
 * Lists the user's existing Google Forms from Google Drive.
 */
export async function listGoogleForms(accessToken: string): Promise<GoogleDriveFormFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form'%20and%20trashed=false&fields=files(id,name,createdTime,modifiedTime,webViewLink)&orderBy=modifiedTime%20desc&pageSize=25`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Forms from Drive: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Retrieves details, items, and questions for a specific Google Form.
 */
export async function getGoogleForm(
  accessToken: string,
  formId: string
): Promise<GoogleFormDetails> {
  const url = `https://forms.googleapis.com/v1/forms/${formId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to retrieve form details: ${res.status} ${errorText}`);
  }

  return await res.json();
}

/**
 * Retrieves all user submissions/responses for a Google Form.
 */
export async function getGoogleFormResponses(
  accessToken: string,
  formId: string
): Promise<GoogleFormResponsesResult> {
  const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch form responses: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const responses = data.responses || [];
  return {
    responses,
    totalResponses: responses.length,
  };
}

/**
 * Creates a brand new Google Form specifically tailored for audience screening and storyboard feedback.
 */
export async function createStoryFeedbackForm(
  accessToken: string,
  projectTitle: string,
  scenes: Scene[]
): Promise<{ form: GoogleFormDetails; editUrl: string; responderUrl: string }> {
  // 1. Create base form
  const createUrl = 'https://forms.googleapis.com/v1/forms';
  const createPayload = {
    info: {
      title: `${projectTitle || 'AI Animated Story'} - Audience Screening & Feedback`,
      documentTitle: `${projectTitle || 'Story'} Feedback Form`,
    },
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Form: ${createRes.status} ${errText}`);
  }

  const initialForm: GoogleFormDetails = await createRes.json();
  const formId = initialForm.formId;

  // 2. Add survey questions via batchUpdate
  const batchUpdateUrl = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;

  const requests: any[] = [
    // Description update
    {
      updateFormInfo: {
        info: {
          description: `Thank you for reviewing the test screening of "${projectTitle}". Please share your feedback on the pacing, character dialogue, and visual tone across the sequence.`,
        },
        updateMask: 'description',
      },
    },
    // Overall Story Rating (1 to 5 stars)
    {
      createItem: {
        item: {
          title: 'Overall Impression of the Story & Cinematic Visuals',
          description: 'How would you rate the visual atmosphere and overall emotional impact?',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Needs Work',
                highLabel: 'Masterpiece',
              },
            },
          },
        },
        location: { index: 0 },
      },
    },
    // Favorite Scene Selection
    {
      createItem: {
        item: {
          title: 'Which shot stood out to you the most?',
          description: 'Select the scene that had the most compelling visual delivery or dialogue.',
          questionItem: {
            question: {
              required: false,
              choiceQuestion: {
                type: 'RADIO',
                options: scenes.map((s, idx) => ({
                  value: `Scene #${s.sceneNumber}: "${s.title}" (${s.sceneLocation || 'Set'} - ${s.duration}s)`,
                })),
              },
            },
          },
        },
        location: { index: 1 },
      },
    },
    // Pacing & Voiceover Delivery Feedback
    {
      createItem: {
        item: {
          title: 'Voiceover Delivery & Dialogue Pacing',
          description: 'Did the spoken narration and voice actor feel natural and well-timed with the video cuts?',
          questionItem: {
            question: {
              required: false,
              choiceQuestion: {
                type: 'CHECKBOX',
                options: [
                  { value: 'Voiceover pacing felt spot on' },
                  { value: 'Audio ducking balanced music and dialogue well' },
                  { value: 'Dialogue was too fast in certain scenes' },
                  { value: 'Would prefer more background ambient sound effects' },
                ],
              },
            },
          },
        },
        location: { index: 2 },
      },
    },
    // Scene-specific detailed feedback
    {
      createItem: {
        item: {
          title: 'Notes & Suggestions for Specific Scenes',
          description: 'Any suggestions on character actions, camera movements, or script lines to refine?',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 3 },
      },
    },
  ];

  const batchRes = await fetch(batchUpdateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    console.warn('Batch update for Google Forms items returned error:', errText);
  }

  const updatedForm = await getGoogleForm(accessToken, formId);

  return {
    form: updatedForm,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: updatedForm.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
  };
}
