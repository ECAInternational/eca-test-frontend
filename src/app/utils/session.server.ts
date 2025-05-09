import { createCookieSessionStorage } from '@remix-run/node';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'tenant_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: ['s3cr3t'], // TODO: Move to environment variable
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

// Flash Message Functionality
const FLASH_MESSAGE_KEY = 'flashMessage';

export type FlashMessage = {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

export async function setFlashMessage(request: Request, flashMessage: FlashMessage) {
  const session = await getSession(request.headers.get('Cookie'));
  session.flash(FLASH_MESSAGE_KEY, flashMessage);
  return session; // Return the session to be committed in the action
}

export async function getFlashMessage(request: Request): Promise<FlashMessage | null> {
  const session = await getSession(request.headers.get('Cookie'));
  // We get the message and immediately commit the session to clear the flash message
  const message = session.get(FLASH_MESSAGE_KEY) as FlashMessage | undefined;
  // It's important to commit the session here if we want the flash message to be cleared after reading.
  // However, this function is typically called in a loader, and the loader itself doesn't return headers for Set-Cookie.
  // The commitSession should happen in the action that sets the message or in a root loader if it consumes it.
  // For getFlashMessage, we just retrieve. The action that *sets* the flash will return the Set-Cookie header.
  return message ?? null;
}
