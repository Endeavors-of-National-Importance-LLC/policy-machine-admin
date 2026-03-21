import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	IconBan,
	IconCopy,
	IconInfoSquareRounded,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { NodeApi } from 'react-arborist';
import {
	Button,
	Group,
	Menu,
	Modal,
	Stack,
	Text,
	TextInput,
	useMantineTheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AssociationModal } from '@/features/info/AssociationModal';
import { PMTree, TreeFilterConfig } from '@/features/pmtree';
import { AssociationDirection, NodeIcon, TreeNode } from '@/features/pmtree/tree-utils';
import { RightPanel, RightPanelComponent, Tab, TOOLBAR_CONFIG } from '@/pages/dashboard/RightPanel';
import { NodeType } from '@/shared/api/pdp.types';
import * as AdjudicationService from '@/shared/api/pdp_adjudication.api';
import * as QueryService from '@/shared/api/pdp_query.api';

export function Dashboard() {
	const theme = useMantineTheme();

	// Tab state
	const [tabs, setTabs] = useState<Tab[]>(() =>
		TOOLBAR_CONFIG.map((c) => ({
			id: c.comp,
			label: c.label,
			icon: c.tabIcon,
			component: c.comp,
			permanent: true,
		}))
	);
	const [activeTabId, setActiveTabId] = useState<string | null>(RightPanelComponent.PROHIBITIONS);

	// Resize state
	const [leftWidth, setLeftWidth] = useState<number>(() => {
		const s = localStorage.getItem('dashboard-left-width');
		return s ? parseInt(s, 10) : 320;
	});
	const dragState = useRef<{ startX: number; startWidth: number } | null>(null);
	const dividerRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Other state
	const [contextMenuOpened, setContextMenuOpened] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
	const [rightClickedNode, setRightClickedNode] = useState<TreeNode | null>(null);
	const [selectedNodes, setSelectedNodes] = useState<TreeNode[]>([]);
	const [createNodeModalOpened, setCreateNodeModalOpened] = useState(false);
	const [nodeTypeToCreate, setNodeTypeToCreate] = useState<NodeType | null>(null);
	const [newNodeName, setNewNodeName] = useState('');
	const [isAssociationModalOpen, setIsAssociationModalOpen] = useState(false);
	const [associationModalNode, setAssociationModalNode] = useState<TreeNode | null>(null);
	const [resourceOperations, setResourceOperations] = useState<string[]>([]);

	useEffect(() => {
		QueryService.getResourceAccessRights()
			.then(setResourceOperations)
			.catch(() => setResourceOperations([]));
	}, []);

	// Clamp leftWidth when container shrinks
	useEffect(() => {
		if (!containerRef.current) return;
		const ro = new ResizeObserver((entries) => {
			const containerW = entries[0].contentRect.width;
			const maxLeft = containerW - 324; // 320px min right + 4px divider
			setLeftWidth((prev) => (prev > maxLeft ? Math.max(150, maxLeft) : prev));
		});
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, []);

	const treeFilters: TreeFilterConfig = {
		nodeTypes: [NodeType.PC, NodeType.UA, NodeType.OA, NodeType.U, NodeType.O],
		showOutgoingAssociations: false,
		showIncomingAssociations: true,
	};

	// Tab management
	const openTab = useCallback((tab: Tab) => {
		setTabs((prev) => (prev.find((t) => t.id === tab.id) ? prev : [...prev, tab]));
		setActiveTabId(tab.id);
	}, []);

	const closeTab = useCallback((tabId: string) => {
		setTabs((prev) => {
			if (prev.find((t) => t.id === tabId)?.permanent) return prev;
			const idx = prev.findIndex((t) => t.id === tabId);
			const next = prev.filter((t) => t.id !== tabId);
			setActiveTabId((cur) => {
				if (cur !== tabId) return cur;
				if (!next.length) return null;
				return next[Math.min(idx, next.length - 1)].id;
			});
			return next;
		});
	}, []);

	const switchTab = useCallback((tabId: string) => setActiveTabId(tabId), []);

	// Resize handlers
	const handleDividerPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			dividerRef.current?.setPointerCapture(e.pointerId);
			dragState.current = { startX: e.clientX, startWidth: leftWidth };
		},
		[leftWidth]
	);

	const handleDividerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragState.current) return;
		const containerW = containerRef.current?.offsetWidth ?? Infinity;
		const newW = Math.min(
			Math.max(150, dragState.current.startWidth + e.clientX - dragState.current.startX),
			containerW - 324, // keep at least 320px for right panel + 4px divider
		);
		setLeftWidth(newW);
	}, []);

	const handleDividerPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
		if (!dragState.current) return;
		const containerW = containerRef.current?.offsetWidth ?? Infinity;
		const finalW = Math.min(
			Math.max(150, dragState.current.startWidth + e.clientX - dragState.current.startX),
			containerW - 324,
		);
		localStorage.setItem('dashboard-left-width', String(finalW));
		dragState.current = null;
	}, []);

	// Event handlers
	const handleNodeRightClick = (node: TreeNode, event: React.MouseEvent) => {
		event.preventDefault();
		if (node.isAssociation) {
			setAssociationModalNode(node);
			setIsAssociationModalOpen(true);
			return;
		}
		setRightClickedNode(node);
		setContextMenuPosition({ x: event.clientX, y: event.clientY });
		setContextMenuOpened(true);
	};

	const handleInfoClick = () => {
		if (rightClickedNode && rightClickedNode.pmId != null) {
			const node = rightClickedNode;
			const pmId = node.pmId!;
			openTab({
				id: `node-info-${pmId}`,
				label: node.name,
				icon: <NodeIcon type={node.type as NodeType} size={18} />,
				component: 'NODE_INFO',
				nodeInfo: node,
			});
		}
		setContextMenuOpened(false);
	};

	const handleCopyNodeName = () => {
		if (rightClickedNode) {
			navigator.clipboard.writeText(rightClickedNode.name);
			notifications.show({
				title: 'Copied',
				message: `Node name "${rightClickedNode.name}" copied to clipboard`,
				color: 'green',
			});
		}
		setContextMenuOpened(false);
	};

	const handleCreateProhibitionClick = () => {
		if (rightClickedNode) {
			setSelectedNodes([rightClickedNode]);
			openTab({
				id: RightPanelComponent.CREATE_PROHIBITION,
				label: 'Create Prohibition',
				icon: <IconBan size={18} />,
				component: RightPanelComponent.CREATE_PROHIBITION,
			});
		}
		setContextMenuOpened(false);
	};

	const handleDeleteNode = async () => {
		if (rightClickedNode && rightClickedNode.pmId) {
			try {
				await AdjudicationService.deleteNode(rightClickedNode.pmId);
				notifications.show({
					title: 'Node Deleted',
					message: `Successfully deleted node "${rightClickedNode.name}"`,
					color: 'green',
				});
			} catch (error) {
				notifications.show({
					title: 'Delete Error',
					message: `Failed to delete node: ${(error as Error).message}`,
					color: 'red',
				});
			}
		}
		setContextMenuOpened(false);
	};

	const getValidChildNodeTypes = (parentType: NodeType): NodeType[] => {
		switch (parentType) {
			case NodeType.PC:
				return [NodeType.UA, NodeType.OA];
			case NodeType.UA:
				return [NodeType.UA, NodeType.U];
			case NodeType.OA:
				return [NodeType.OA, NodeType.O];
			default:
				return [];
		}
	};

	const handleCreateNodeClick = (nodeType: NodeType) => {
		setNodeTypeToCreate(nodeType);
		setNewNodeName('');
		setCreateNodeModalOpened(true);
		setContextMenuOpened(false);
	};

	const handleCreateNodeCancel = () => {
		setCreateNodeModalOpened(false);
		setNodeTypeToCreate(null);
		setNewNodeName('');
	};

	const handleCreateNodeConfirm = async () => {
		try {
			if (nodeTypeToCreate === NodeType.PC) {
				await AdjudicationService.createPolicyClass(newNodeName.trim());
			} else {
				if (!rightClickedNode || !rightClickedNode.pmId || !nodeTypeToCreate || !newNodeName.trim()) {
					return;
				}
				switch (nodeTypeToCreate) {
					case NodeType.UA:
						await AdjudicationService.createUserAttribute(newNodeName.trim(), [
							rightClickedNode.pmId,
						]);
						break;
					case NodeType.OA:
						await AdjudicationService.createObjectAttribute(newNodeName.trim(), [
							rightClickedNode.pmId,
						]);
						break;
					case NodeType.U:
						await AdjudicationService.createUser(newNodeName.trim(), [rightClickedNode.pmId]);
						break;
					case NodeType.O:
						await AdjudicationService.createObject(newNodeName.trim(), [rightClickedNode.pmId]);
						break;
				}
			}
			notifications.show({
				title: 'Node Created',
				message: `Successfully created ${nodeTypeToCreate} "${newNodeName.trim()}"`,
				color: 'green',
			});
		} catch (error) {
			notifications.show({
				title: 'Create Error',
				message: `Failed to create node: ${(error as Error).message}`,
				color: 'red',
			});
		}
		handleCreateNodeCancel();
	};

	const handleAssociationModalClose = () => {
		setIsAssociationModalOpen(false);
		setAssociationModalNode(null);
	};

	const handleAssociationModalSubmit = async (selectedNode: TreeNode, accessRights: string[]) => {
		const details = associationModalNode?.associationDetails;
		const { ua, target } = details ?? {};
		if (!ua || !target) return;
		try {
			await AdjudicationService.dissociate(ua.id, target.id);
			await AdjudicationService.associate(ua.id, target.id, accessRights);
			notifications.show({
				color: 'green',
				title: 'Association Updated',
				message: 'Access rights updated successfully',
			});
		} catch (error) {
			notifications.show({ color: 'red', title: 'Update Error', message: (error as Error).message });
		}
		handleAssociationModalClose();
	};

	const handleAssociationModalDelete = async (assocNode: TreeNode) => {
		const details = assocNode.associationDetails;
		const { ua, target } = details ?? {};
		if (!ua || !target) return;
		try {
			await AdjudicationService.dissociate(ua.id, target.id);
			notifications.show({
				color: 'green',
				title: 'Association Deleted',
				message: 'Association deleted successfully',
			});
		} catch (error) {
			notifications.show({ color: 'red', title: 'Delete Error', message: (error as Error).message });
		}
		handleAssociationModalClose();
	};

	const handleSelect = (nodeApi: NodeApi<TreeNode>[]) => {
		const treeNodes = nodeApi.map((api) => api.data);
		setSelectedNodes(treeNodes);
	};

	return (
		<>
			<div
				ref={containerRef}
				style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}
			>
				{/* Left panel — PMTree full height */}
				<div
					style={{
						width: leftWidth,
						flexShrink: 0,
						minWidth: 150,
						height: '100%',
						overflow: 'hidden',
					}}
				>
					<PMTree
						style={{ width: '100%', height: '100%' }}
						direction="ascendants"
						filterConfig={treeFilters}
						clickHandlers={{ onRightClick: handleNodeRightClick, onSelect: handleSelect }}
						showCreatePolicyClass
						onCreatePolicyClass={() => handleCreateNodeClick(NodeType.PC)}
					/>
				</div>

				{/* Drag divider */}
				<div
					ref={dividerRef}
					onPointerDown={handleDividerPointerDown}
					onPointerMove={handleDividerPointerMove}
					onPointerUp={handleDividerPointerUp}
					style={{
						width: 4,
						flexShrink: 0,
						cursor: 'col-resize',
						backgroundColor: 'var(--mantine-color-gray-3)',
						userSelect: 'none',
						touchAction: 'none',
					}}
				/>

				{/* Right panel — tab system */}
				<div style={{ flex: 1, minWidth: 320, height: '100%', overflow: 'hidden' }}>
					<RightPanel
						tabs={tabs}
						activeTabId={activeTabId}
						selectedNodes={selectedNodes}
						onTabSwitch={switchTab}
						onTabClose={closeTab}
					/>
				</div>
			</div>

			<Menu
				opened={contextMenuOpened}
				onClose={() => setContextMenuOpened(false)}
				position="bottom-start"
				withArrow={false}
				shadow="md"
			>
				<Menu.Target>
					<div
						style={{
							position: 'fixed',
							left: contextMenuPosition.x,
							top: contextMenuPosition.y,
							width: 1,
							height: 1,
						}}
					/>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item
						onClick={handleInfoClick}
						leftSection={<IconInfoSquareRounded size={16} />}
						style={{
							backgroundColor: `var(--mantine-color-${theme.primaryColor}-0)`,
							borderLeft: `3px solid ${theme.colors[theme.primaryColor][6]}`,
						}}
					>
						Info
					</Menu.Item>

					<Menu.Item onClick={handleCopyNodeName} leftSection={<IconCopy size={16} />}>
						Copy Node Name
					</Menu.Item>

					{rightClickedNode &&
						getValidChildNodeTypes(rightClickedNode.type as NodeType).length > 0 && (
							<>
								<Menu.Divider />
								<Menu.Label>Create Node</Menu.Label>
								{getValidChildNodeTypes(rightClickedNode.type as NodeType).map((nodeType) => (
									<Menu.Item
										key={nodeType}
										leftSection={<NodeIcon type={nodeType} size={16} />}
										rightSection={<IconPlus size={16} />}
										onClick={() => handleCreateNodeClick(nodeType)}
									>
										Create {nodeType}
									</Menu.Item>
								))}
							</>
						)}

					{rightClickedNode &&
						(rightClickedNode.type === NodeType.U || rightClickedNode.type === NodeType.UA) && (
							<>
								<Menu.Divider />
								<Menu.Label>Prohibition</Menu.Label>
								<Menu.Item
									onClick={handleCreateProhibitionClick}
									leftSection={<IconBan size={16} />}
								>
									Create Prohibition
								</Menu.Item>
							</>
						)}

					{rightClickedNode && rightClickedNode.pmId != null && (
						<>
							<Menu.Divider />
							<Menu.Label>Delete</Menu.Label>
							<Menu.Item
								onClick={handleDeleteNode}
								leftSection={<IconTrash size={16} />}
								color="red"
							>
								Delete Node
							</Menu.Item>
						</>
					)}
				</Menu.Dropdown>
			</Menu>

			{isAssociationModalOpen &&
				associationModalNode &&
				(() => {
					const details = associationModalNode.associationDetails;
					const direction = details?.type ?? AssociationDirection.Incoming;
					const rootPmNode =
						direction === AssociationDirection.Outgoing ? details?.ua : details?.target;
					const rootTreeNode = rootPmNode
						? { id: crypto.randomUUID(), pmId: rootPmNode.id, name: rootPmNode.name, type: rootPmNode.type }
						: undefined;
					return (
						<AssociationModal
							opened={isAssociationModalOpen}
							onClose={handleAssociationModalClose}
							direction={direction}
							onSubmit={handleAssociationModalSubmit}
							onDelete={handleAssociationModalDelete}
							resourceOperations={resourceOperations}
							mode="edit"
							associationNode={associationModalNode}
							rootNode={rootTreeNode}
						/>
					);
				})()}

			<Modal
				opened={createNodeModalOpened}
				onClose={handleCreateNodeCancel}
				title={
					<Group gap="sm">
						<Text size="lg" fw={600}>
							Create New Node
						</Text>
					</Group>
				}
				size="sm"
			>
				<Stack gap="md">
					{rightClickedNode && nodeTypeToCreate !== NodeType.PC && (
						<Group
							gap="sm"
							p="sm"
							style={{
								backgroundColor: 'var(--mantine-color-gray-0)',
								borderRadius: '8px',
								overflowX: 'auto',
								overflowY: 'hidden',
								minWidth: 0,
							}}
						>
							<Group gap="xs" wrap="nowrap">
								<NodeIcon
									type={rightClickedNode.type}
									size={18}
									style={{ flexShrink: 0 }}
								/>
								<Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
									{rightClickedNode.name}
								</Text>
							</Group>
						</Group>
					)}

					<TextInput
						label="Name"
						placeholder="Name"
						value={newNodeName}
						onChange={(e) => setNewNodeName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && newNodeName.trim()) {
								handleCreateNodeConfirm();
							}
						}}
						data-autofocus
						required
						leftSection={nodeTypeToCreate && <NodeIcon type={nodeTypeToCreate} size={20} />}
					/>

					<Group justify="flex-end" gap="sm" mt="md">
						<Button variant="outline" onClick={handleCreateNodeCancel}>
							Cancel
						</Button>
						<Button onClick={handleCreateNodeConfirm} disabled={!newNodeName.trim()}>
							Create
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
