import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FormDialog } from '../src/components/form-dialog';
import { StagedConfirmDialog } from '../src/components/staged-confirm-dialog';

describe('FormDialog', () => {
  it('opens the shared shell from its trigger', async () => {
    const user = userEvent.setup();

    render(
      <FormDialog
        trigger={<button type="button">Open</button>}
        title="Kategorie bearbeiten"
        description="Dialogbeschreibung">
        <div>Form body</div>
      </FormDialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByText('Kategorie bearbeiten')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('text-lg');
    expect(screen.getByText('Dialogbeschreibung')).toBeInTheDocument();
    expect(screen.getByText('Form body')).toBeInTheDocument();
  });
});

describe('StagedConfirmDialog', () => {
  it('moves from the first confirmation step into the final step', async () => {
    const user = userEvent.setup();

    render(
      <StagedConfirmDialog
        trigger={<button type="button">Delete</button>}
        firstStep={{
          title: 'Ersten Schritt prüfen',
          description: 'Bitte kurz bestätigen.',
          confirmLabel: 'Weiter',
        }}
        secondStep={{
          title: 'Wirklich löschen?',
          description: 'Dieser Schritt ist final.',
          children: <div>Final action</div>,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Ersten Schritt prüfen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(screen.getByText('Wirklich löschen?')).toBeInTheDocument();
    expect(screen.getByText('Final action')).toBeInTheDocument();
  });
});
