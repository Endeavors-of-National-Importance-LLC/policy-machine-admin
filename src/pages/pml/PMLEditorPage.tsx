import { AppShell, Button, Group, Title, useMantineTheme } from '@mantine/core';
import { PMIcon } from '@/components/icons/PMIcon';
import { UserMenu } from '@/features/user-menu/UserMenu';
import { PMLEditor } from '@/features/pml/PMLEditor';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';

const STORAGE_KEY = 'pml-editor-draft';

export function PMLEditorPage() {
  const mantineTheme = useMantineTheme();
  const savedContent = localStorage.getItem(STORAGE_KEY) ?? '';

  return (
    <AppShell
      header={{ height: 40 }}
      transitionDuration={0}
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <AppShell.Header style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <PMIcon style={{ width: '32px', height: '32px' }} />
            <Title order={3}>PML Editor</Title>
          </Group>
          <Group>
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main
        style={{
          backgroundColor: mantineTheme.other.intellijContentBg,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          padding: '12px',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, paddingTop: '40px' }}>
          <PMLEditor
            title="PML Editor"
            initialValue={savedContent}
            onChange={(v) => localStorage.setItem(STORAGE_KEY, v)}
            saveMode={true}
            containerHeight="100%"
            autoFocus
          />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
