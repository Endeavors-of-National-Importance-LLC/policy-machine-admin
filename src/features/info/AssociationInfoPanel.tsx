import React, { useEffect, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import {
	ActionIcon,
	Box,
	Button,
	Divider,
	Group,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AccessRightsTree } from '@/components/access-rights';
import {
	AssociationDirection,
	NodeIcon,
	TreeNode,
} from '@/features/pmtree/tree-utils';
import * as AdjudicationService from '@/shared/api/pdp_adjudication.api';
import * as QueryService from '@/shared/api/pdp_query.api';

interface AssociationInfoPanelProps {
	associationNode: TreeNode;
	onClose?: () => void;
	onUpdated?: () => void;
	onDeleted?: () => void;
}

export function AssociationInfoPanel({
	associationNode,
	onClose,
	onUpdated,
	onDeleted,
}: AssociationInfoPanelProps) {
	const [resourceOperations, setResourceOperations] = useState<string[]>([]);
	const [selectedAccessRights, setSelectedAccessRights] = useState<string[]>(
		associationNode.associationDetails?.accessRightSet ?? []
	);

	useEffect(() => {
		QueryService.getResourceAccessRights()
			.then(setResourceOperations)
			.catch(() => setResourceOperations([]));
	}, []);

	// Re-initialize when associationNode changes
	useEffect(() => {
		setSelectedAccessRights(associationNode.associationDetails?.accessRightSet ?? []);
	}, [associationNode]);

	const details = associationNode.associationDetails;
	const ua = details?.ua;
	const target = details?.target;

	const handleUpdate = async () => {
		if (!ua || !target) return;
		try {
			await AdjudicationService.dissociate(ua.id, target.id);
			await AdjudicationService.associate(ua.id, target.id, selectedAccessRights);
			notifications.show({
				color: 'green',
				title: 'Association Updated',
				message: 'Access rights updated successfully',
			});
			onUpdated?.();
		} catch (error) {
			notifications.show({
				color: 'red',
				title: 'Update Error',
				message: (error as Error).message,
			});
		}
	};

	const handleDelete = async () => {
		if (!ua || !target) return;
		try {
			await AdjudicationService.dissociate(ua.id, target.id);
			notifications.show({
				color: 'green',
				title: 'Association Deleted',
				message: 'Association deleted successfully',
			});
			onDeleted?.();
			onClose?.();
		} catch (error) {
			notifications.show({
				color: 'red',
				title: 'Delete Error',
				message: (error as Error).message,
			});
		}
	};

	return (
		<Stack
			gap="xs"
			style={{
				padding: '10px 20px 20px 20px',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				backgroundColor: 'var(--mantine-color-gray-0)',
			}}
		>
			{/* Header */}
			<Group justify="space-between" wrap="nowrap">
				<Text fw={600} size="md">
					Association
				</Text>
				{onClose && (
					<ActionIcon
						variant="subtle"
						color="gray"
						onClick={onClose}
						aria-label="Close panel"
					>
						<IconX size={18} />
					</ActionIcon>
				)}
			</Group>
			<Divider />

			{/* Source */}
			<Box style={{ flexShrink: 0 }}>
				<Text size="xs" c="dimmed" mb={4}>
					Source
				</Text>
				{ua && (
					<Group gap="xs">
						<NodeIcon type={ua.type} size={24} />
						<Text size="sm" fw={500}>
							{ua.name}
						</Text>
					</Group>
				)}
			</Box>

			{/* Target */}
			<Box style={{ flexShrink: 0 }}>
				<Text size="xs" c="dimmed" mb={4}>
					Target
				</Text>
				{target && (
					<Group gap="xs">
						<NodeIcon type={target.type} size={24} />
						<Text size="sm" fw={500}>
							{target.name}
						</Text>
					</Group>
				)}
			</Box>

			{/* Access Rights */}
			<Box
				style={{
					flex: 1,
					minHeight: 0,
					display: 'flex',
					flexDirection: 'column',
					border: '1px solid var(--mantine-color-gray-3)',
					borderRadius: '4px',
					overflow: 'hidden',
				}}
			>
				<AccessRightsTree
					availableRights={resourceOperations}
					selectedRights={selectedAccessRights}
					onChange={setSelectedAccessRights}
				/>
			</Box>

			{/* Actions */}
			<Group justify="center" gap="xs">
				{onClose && (
					<Button variant="outline" color="gray" onClick={onClose}>
						Cancel
					</Button>
				)}
				<Button variant="filled" color="red" onClick={handleDelete}>
					Delete
				</Button>
				<Button
					variant="filled"
					color="blue"
					onClick={handleUpdate}
					disabled={selectedAccessRights.length === 0}
				>
					Update
				</Button>
			</Group>
		</Stack>
	);
}
