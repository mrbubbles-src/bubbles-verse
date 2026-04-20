import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardRouteState } from '@/components/dashboard-route-state';

describe('DashboardRouteState', () => {
  it('renders the shared route-state copy, actions, and optional detail panel', () => {
    render(
      <DashboardRouteState
        eyebrow="Status"
        title="Alles gut sichtbar"
        description="Die gemeinsame Zustandsfläche rendert Copy und Aktionen."
        visual={<span>V</span>}
        actions={<button type="button">Retry</button>}
        details={<p>Mehr Kontext</p>}
        tone="danger"
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Alles gut sichtbar' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Die gemeinsame Zustandsfläche rendert Copy und Aktionen.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByText('Mehr Kontext')).toBeInTheDocument();
  });
});
