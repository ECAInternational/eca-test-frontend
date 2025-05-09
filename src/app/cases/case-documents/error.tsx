import { Link, useRouteError } from '@remix-run/react';
import { Button } from '@ecainternational/eca-components';

export default function ErrorBoundary() {
  const error = useRouteError() as { data?: { message?: string; backUrl?: string } };
  const message = error?.data?.message || 'An error occurred';
  const backUrl = error?.data?.backUrl || '/';

  return (
    <div className="flex h-full flex-col items-center justify-center bg-neutral-layer-1">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="heading-lg-mid text-neutral-body">Oops!</h1>
          <p className="paragraph-md text-neutral-detail">{message}</p>
        </div>
        <Link to={backUrl}>
          <Button name="back" variant="primary">
            Go Back
          </Button>
        </Link>
      </div>
    </div>
  );
}
