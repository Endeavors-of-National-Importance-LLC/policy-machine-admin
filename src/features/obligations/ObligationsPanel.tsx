import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Text,
    Group,
    Title,
    Stack,
    Center,
    Button,
    ThemeIcon,
    Tooltip,
    UnstyledButton
} from "@mantine/core";
import {IconTrash, IconCalendarCode, IconUser} from "@tabler/icons-react";
import { Obligation } from "@/shared/api/pdp.types";
import * as QueryService from "@/shared/api/pdp_query.api";
import * as AdjudicationService from "@/shared/api/pdp_adjudication.api";
import { PMLEditor } from "@/features/pml/PMLEditor";
import { AuthService } from "@/lib/auth";
import { notifications } from "@mantine/notifications";
import { ListDetailPanel } from "@/components/ListDetailPanel";

export function ObligationsPanel() {
    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedObligation, setSelectedObligation] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Fetch obligations on component mount
    const fetchObligations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedObligations = await QueryService.getObligations();
            setObligations(fetchedObligations);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchObligations();
    }, [fetchObligations]);

    const handleCreateNew = useCallback(() => {
        setIsCreatingNew(true);
        setSelectedObligation(null);
    }, []);

    const handleSelectObligation = useCallback((name: string) => {
        setSelectedObligation(name);
        setIsCreatingNew(false);
    }, []);

    // Handle creating new obligation
    const handleCreateObligation = useCallback(async (pml: string) => {
        // Extract obligation name from PML content
        const obligationNameMatch = pml.match(/create\s+obligation\s+"([^"]+)"/i);
        if (!obligationNameMatch) {
            throw new Error('PML must contain "create obligation \\"name\\"" statement');
        }

        const extractedName = obligationNameMatch[1];
        const currentUser = AuthService.getUsername();

        if (!currentUser) {
            throw new Error('Unable to determine current user');
        }

        // Execute the PML to create the obligation
        await AdjudicationService.executePML(pml);

        // Create obligation object to add to local state
        const newObligation: Obligation = {
            name: extractedName,
            author: {
                id: 0n,
                name: currentUser,
                type: 'U' as any,
                properties: {}
            },
            pml
        };

        // Add to local state
        setObligations(prev => [...prev, newObligation]);

        // Reset creation state and select the new obligation
        setIsCreatingNew(false);
        setSelectedObligation(extractedName);

        notifications.show({
            color: 'green',
            title: 'Obligation Created',
            message: 'Obligation has been created successfully',
        });
    }, []);

    // Handle deleting an obligation
    const handleDeleteObligation = useCallback(async (obligationName: string) => {
        setIsDeleting(obligationName);

        try {
            await AdjudicationService.deleteObligation(obligationName);

            // Remove from local state
            setObligations(prev => prev.filter(o => o.name !== obligationName));
            setSelectedObligation(null);

            notifications.show({
                color: 'green',
                title: 'Obligation Deleted',
                message: 'Obligation has been deleted successfully',
            });
        } catch (error) {
            notifications.show({
                color: 'red',
                title: 'Delete Error',
                message: (error as Error).message,
            });
        } finally {
            setIsDeleting(null);
        }
    }, []);

    // Filter obligations based on search text
    const filteredObligations = useMemo(() => {
        if (!filterText.trim()) {
            return obligations;
        }

        const searchText = filterText.toLowerCase();
        return obligations.filter(obligation =>
            obligation.name.toLowerCase().includes(searchText)
        );
    }, [obligations, filterText]);

    // Get the currently selected obligation object
    const currentObligation = useMemo(() => {
        if (!selectedObligation) {return null;}
        return obligations.find(o => o.name === selectedObligation) || null;
    }, [obligations, selectedObligation]);

    const listHeader = obligations.length > 0 ? (
        <Text size="xs" c="dimmed" fw={500} tt="uppercase" px="xs" mb={6}>
            {filteredObligations.length} of {obligations.length} obligation{obligations.length !== 1 ? 's' : ''}
        </Text>
    ) : undefined;

    const listContent = (
        <Box p="xs">
            {obligations.length === 0 && !isCreatingNew ? (
                <Center py="xl">
                    <Stack align="center" gap="xs">
                        <ThemeIcon variant="light" color="gray" size="xl" radius="xl">
                            <IconCalendarCode size={20} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">No obligations found</Text>
                    </Stack>
                </Center>
            ) : null}

            {obligations.length > 0 && filteredObligations.length === 0 && filterText.trim() ? (
                <Center py="lg">
                    <Text size="sm" c="dimmed">No matches found</Text>
                </Center>
            ) : null}

            <Stack gap={4}>
                {filteredObligations.map((obligation) => {
                    const isActive = selectedObligation === obligation.name && !isCreatingNew;
                    return (
                        <Tooltip
                            key={obligation.name}
                            label={obligation.name}
                            position="right"
                            withArrow
                            openDelay={400}
                        >
                        <UnstyledButton
                            onClick={() => handleSelectObligation(obligation.name)}
                            style={{
                                borderRadius: 'var(--mantine-radius-sm)',
                                padding: '8px 10px',
                                backgroundColor: isActive
                                    ? 'var(--mantine-primary-color-light)'
                                    : 'transparent',
                                border: isActive
                                    ? '1px solid var(--mantine-primary-color-light-color)'
                                    : '1px solid transparent',
                                transition: 'background-color 150ms ease, border-color 150ms ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-default-hover)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <Group gap="sm" wrap="nowrap">
                                <ThemeIcon
                                    variant={isActive ? 'filled' : 'light'}
                                    color={isActive ? 'var(--mantine-primary-color-filled)' : 'gray'}
                                    size="md"
                                    radius="sm"
                                >
                                    <IconCalendarCode size={14} />
                                </ThemeIcon>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        size="sm"
                                        fw={isActive ? 600 : 500}
                                        truncate
                                    >
                                        {obligation.name}
                                    </Text>
                                    {obligation.author?.name && (
                                        <Group gap={4} mt={2}>
                                            <IconUser size={10} color="var(--mantine-color-dimmed)" />
                                            <Text size="xs" c="dimmed" truncate>
                                                {obligation.author.name}
                                            </Text>
                                        </Group>
                                    )}
                                </Box>
                            </Group>
                        </UnstyledButton>
                        </Tooltip>
                    );
                })}
            </Stack>
        </Box>
    );

    const detailContent = isCreatingNew ? (
        <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 10px 10px 10px' }}>
            <Group mb="md" justify="space-between">
                <Title order={5}>Create New Obligation</Title>
                <Button variant="default" size="xs" onClick={() => setIsCreatingNew(false)}>
                    Cancel
                </Button>
            </Group>
            <Box style={{ flex: 1, minHeight: 0 }}>
                <PMLEditor
                    onExecute={handleCreateObligation}
                    containerHeight="100%"
                    autoFocus
                />
            </Box>
        </Box>
    ) : currentObligation ? (
        <Box p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Group mb="md" justify="space-between">
                <Stack gap={0}>
                    <Title order={5}>{currentObligation.name}</Title>
                    <Text size="sm" c="dimmed">Author: {currentObligation.author?.name || 'Unknown'}</Text>
                </Stack>
                <Button
                    color="red"
                    variant="light"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    loading={isDeleting === currentObligation.name}
                    onClick={() => handleDeleteObligation(currentObligation.name)}
                >
                    Delete
                </Button>
            </Group>
            <Box style={{ flex: 1, minHeight: 0 }}>
                <PMLEditor
                    initialValue={currentObligation.pml}
                    readOnly
                    hideButtons
                    containerHeight="100%"
                />
            </Box>
        </Box>
    ) : (
        <Center style={{ height: '100%' }}>
            <Stack align="center" gap="xs">
                <IconCalendarCode size={48} color="gray" />
                <Text c="dimmed" size="sm">Select an obligation to view details</Text>
            </Stack>
        </Center>
    );

    return (
        <ListDetailPanel
            title="Obligations"
            onCreateClick={handleCreateNew}
            isCreatingNew={isCreatingNew}
            filterText={filterText}
            onFilterChange={setFilterText}
            onRefresh={fetchObligations}
            refreshDisabled={loading}
            listHeader={listHeader}
            listContent={listContent}
            detailContent={detailContent}
            loading={loading}
            error={error}
        />
    );
}
