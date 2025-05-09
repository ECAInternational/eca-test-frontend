import type { LinksFunction, LoaderFunctionArgs, ActionFunctionArgs, Session as RemixSession, TypedResponse } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  json,
  Form,
  Link,
} from '@remix-run/react';
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import MainNav from './components/navigation/MainNav';
import { getSession, commitSession, getFlashMessage, type FlashMessage } from './utils/session.server';
import applicationData from './data/application-data.json';
import ThemeSwitcher from './components/ThemeSwitcher';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'; 
import './tailwind.css';

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://cdn-uicons.flaticon.com/2.1.0/uicons-solid-straight/css/uicons-solid-straight.css',
  },
  {
    rel: 'stylesheet',
    href: 'https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css',
  },
];

interface RootLoaderData {
  selectedTenant: (typeof applicationData.tenants[0]) | undefined;
  systemVariables: typeof applicationData.systemVariables;
  flashMessage: FlashMessage | null;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<TypedResponse<RootLoaderData>> => {
  const session: RemixSession = await getSession(request.headers.get('Cookie'));
  const tenantId = session.get('tenantId') as string | undefined;
  
  const flashMessageFromSession: FlashMessage | null = await getFlashMessage(request);

  let currentSelectedTenant: (typeof applicationData.tenants[0]) | undefined = undefined;

  if (applicationData.tenants.length > 0) {
    currentSelectedTenant = applicationData.tenants.find(t => t.tenantId === tenantId);
    if (!currentSelectedTenant) {
      currentSelectedTenant = applicationData.tenants[0];
      session.set('tenantId', currentSelectedTenant.tenantId);
    }
  } else {
    session.unset('tenantId');
  }
  
  const loaderData: RootLoaderData = {
    selectedTenant: currentSelectedTenant,
    systemVariables: applicationData.systemVariables,
    flashMessage: flashMessageFromSession,
  };
  
  return json(loaderData, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'));
  const formData = await request.formData();
  const tenantId = formData.get('tenantId');

  if (typeof tenantId === 'string') {
    const selectedTenant = applicationData.tenants.find((t) => t.tenantId === tenantId);
    if (!selectedTenant) {
      throw new Response('Tenant not found during action', { status: 404 }); 
    }
    session.set('tenantId', tenantId);
    session.unset('caseId');
    return json({ success: true, selectedTenant }, { headers: { 'Set-Cookie': await commitSession(session) } });
  }
  return json({ success: false, error: 'Invalid action.' }, { status: 400 });
};

const toastStyles: Record<FlashMessage['type'], string> = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  info: 'bg-blue-500 border-blue-600',
  warning: 'bg-yellow-500 border-yellow-600',
};

const toastIcons: Record<FlashMessage['type'], React.ReactElement> = {
  success: <CheckCircle className="h-5 w-5 mr-2" />,
  error: <AlertCircle className="h-5 w-5 mr-2" />,
  info: <Info className="h-5 w-5 mr-2" />,
  warning: <AlertTriangle className="h-5 w-5 mr-2" />,
};

export default function App() {
  const { selectedTenant, systemVariables, flashMessage } = useLoaderData<RootLoaderData>();
  const navigation = useNavigation();
  const isChangingTenant = navigation.state === 'submitting' && 
    navigation.formData?.get('tenantId') !== selectedTenant?.tenantId;

  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState<FlashMessage | null>(null);

  useEffect(() => {
    if (flashMessage?.message) { 
      setCurrentToast(flashMessage);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  useEffect(() => {
    if (!i18n.isInitialized) i18n.init();
  }, []);

  return (
    <html lang="en" className="h-full eca-light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {showToast && currentToast && (
          <div 
            className={`fixed top-5 right-5 z-[100] p-4 rounded-md text-white shadow-lg flex items-center justify-between max-w-sm ${toastStyles[currentToast.type]}`}
            role="alert"
          >
            <div className="flex items-center">
              {toastIcons[currentToast.type]}
              <span>{currentToast.message}</span>
            </div>
            <button onClick={() => setShowToast(false)} className="ml-4" aria-label="Close toast"><X size={20} /></button>
          </div>
        )}
        <div className="flex h-full">
          {selectedTenant && (
             <div className="flex w-64 flex-col border-r bg-neutral-layer-2">
               <div className="flex h-16 items-center justify-center border-b px-6">
                 <img className="h-8 w-auto" src="/prototype/ageas-logo.svg" alt="Logo" />
               </div>
               <MainNav selectedTenant={selectedTenant} />
             </div>
          )}
          <main className={`flex-1 overflow-y-auto bg-neutral-layer-1 ${isChangingTenant ? 'opacity-50' : ''} ${!selectedTenant ? 'w-full' : ''}`}>
            <div className="flex h-16 items-center justify-between px-8">
              <div>{!selectedTenant && <span className="text-red-600">No Tenant</span>}</div>
              {selectedTenant && (
                <div className="flex items-center space-x-2">
                  <div className="divide-divide hidden divide-x rounded-sm shadow-none lg:inline-flex">
                    <div className="relative z-0 inline-flex rounded-full text-xs shadow-none sm:text-sm">
                      <Link
                        to="/"
                        className="text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground border-1 border-border relative inline-flex items-center space-x-1 rounded-md border p-2 font-medium shadow-inner focus:z-10 focus:outline-none bg-neutral-layer-1 border-1 border-border hover:text-neutral-detail focus:text-neutral-detail hover:bg-secondary text-gray-800 focus:z-10 focus:bg-gray-100 focus:outline-none"
                      >
                        <div>
                          <span>Subscribe</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  <div className="hidden sm:block" data-testid="theme-switcher">
                    <ThemeSwitcher />
                  </div>
                  <button className="items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary hover:text-secondary-foreground h-9 px-4 py-2 w-10 space-x-2 hidden lg:flex">
                    <div className="text-muted-foreground inline-flex shrink-0 items-center rounded-full p-1 text-xs font-medium theme-custom">
                      <div className="p-0.5">
                        <svg className="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  <div>
                    <div className="relative">
                      <div className="divide-divide inline-flex divide-x rounded-sm shadow-none">
                        <button type="button" className="hover:border-1 border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus:ring-ring border-default-transparent relative inline-flex items-center rounded-full border p-2 font-medium focus:z-10 focus:outline-none focus:ring-offset-2">
                          <span className="relative inline-block size-5 overflow-hidden rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative hidden sm:inline-flex">
                    <div className="relative">
                      <div className="divide-divide inline-flex divide-x rounded-sm shadow-none">
                        <div className="relative z-0 inline-flex rounded-full text-sm shadow-none">
                          <button type="button" className="hover:border-1 border-border bg-neutral-layer-1 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground border-default-transparent relative inline-flex items-center rounded-full border p-2 font-medium shadow-inner focus:z-10 focus:outline-none focus:ring-offset-2">
                            <span className="sr-only">Chat</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative hidden sm:block">
                    <div className="divide-divide inline-flex divide-x rounded-sm shadow-none">
                      <Link
                        to="/"
                        className="hover:border-1 border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground focus:ring-ring border-default-transparent relative inline-flex items-center rounded-full border p-2 font-medium focus:z-10 focus:outline-none focus:ring-offset-2"
                      >
                        <span className="relative inline-block size-5 overflow-hidden rounded-full">
                          <svg className="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <I18nextProvider i18n={i18n}>
              <Outlet context={{ selectedTenant, systemVariables }} />
            </I18nextProvider>
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
