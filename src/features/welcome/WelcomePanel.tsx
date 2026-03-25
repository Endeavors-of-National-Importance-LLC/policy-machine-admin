import React from 'react';
import { Badge, Divider, List, Stack, Text, Title } from '@mantine/core';
import pmIcon from '@/assets/pm-icon.svg';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Stack gap="sm">
			<Title order={3}>{title}</Title>
			{children}
		</Stack>
	);
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Stack gap="xs">
			<Title order={5} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
				{title}
			</Title>
			{children}
		</Stack>
	);
}

function CodeBlock({ children }: { children: string }) {
	return (
		<pre
			style={{
				margin: 0,
				padding: '12px 16px',
				backgroundColor: 'var(--mantine-color-dark-8)',
				color: 'var(--mantine-color-gray-3)',
				borderRadius: 6,
				fontSize: 12,
				lineHeight: 1.6,
				overflowX: 'auto',
				fontFamily: 'monospace',
			}}
		>
			{children.trim()}
		</pre>
	);
}

const NODE_TYPES = [
	{
		label: 'PC',
		name: 'Policy Class',
		color: 'green',
		desc: 'Root container for a policy domain. All other nodes belong to at least one PC. You can create multiple PCs to model independent or overlapping access domains.',
	},
	{
		label: 'UA',
		name: 'User Attribute',
		color: 'red',
		desc: 'Represents a group, role, or category of users. UAs can be nested inside other UAs or a PC, forming a user hierarchy. Associations always originate from a UA.',
	},
	{
		label: 'OA',
		name: 'Object Attribute',
		color: 'blue',
		desc: 'Represents a group or category of resources. OAs can be nested inside other OAs or a PC. Associations always target an OA (or O/UA in some configurations).',
	},
	{
		label: 'U',
		name: 'User',
		color: 'pink',
		desc: 'A concrete individual user. Users are leaf nodes and must be assigned to at least one UA. They cannot contain other nodes.',
	},
	{
		label: 'O',
		name: 'Object',
		color: 'indigo',
		desc: 'A concrete resource or data object. Objects are leaf nodes and must be assigned to at least one OA. They cannot contain other nodes.',
	},
];

export function WelcomePanel() {
	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				backgroundColor: 'var(--mantine-color-gray-0)',
				display: 'flex',
				justifyContent: 'center',
				padding: '48px 24px',
			}}
		>
			<Stack gap="xl" style={{ maxWidth: 680, width: '100%' }}>

				{/* Header */}
				<Stack align="center" gap="md">
					<img src={pmIcon} alt="Policy Machine" style={{ width: 80, height: 80 }} />
					<Title order={1} ta="center">
						Policy Machine Admin Tool
					</Title>
					<Text c="dimmed" ta="center" size="sm" maw={520}>
						A visual administration interface for NGAC (Next Generation Access Control) policy
						graphs. Model access control policies by building a graph of nodes, assignments,
						associations, prohibitions, and obligations.
					</Text>
				</Stack>

				<Divider />

				{/* Policy Graph */}
				<Section title="Policy Graph">
					<Text size="sm">
						The left panel displays the full policy graph as an interactive tree. The graph is
						composed of five node types that form a hierarchy. Right-click any node to open its
						context menu.
					</Text>

					<SubSection title="Node Types">
						<Stack gap="xs">
							{NODE_TYPES.map((n) => (
								<div key={n.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
									<Badge color={n.color} variant="filled" size="sm" style={{ flexShrink: 0, marginTop: 2 }}>
										{n.label}
									</Badge>
									<Text size="sm">
										<Text span fw={600}>{n.name}</Text> — {n.desc}
									</Text>
								</div>
							))}
						</Stack>
					</SubSection>

					<SubSection title="Assignments">
						<Text size="sm">
							An <Text span fw={600}>assignment</Text> places one node inside another, forming the
							hierarchical structure of the graph. The following assignments are valid:
						</Text>
						<List size="sm" spacing={4}>
							<List.Item>UA → PC or UA (user attribute inside a policy class or another user attribute)</List.Item>
							<List.Item>OA → PC or OA (object attribute inside a policy class or another object attribute)</List.Item>
							<List.Item>U → UA (user assigned to a user attribute)</List.Item>
							<List.Item>O → OA (object assigned to an object attribute)</List.Item>
						</List>
						<Text size="sm" c="dimmed">
							Leaf nodes (U, O) cannot have children. PC nodes cannot be assigned to other nodes.
							Use the node info panel to assign or deassign children.
						</Text>
					</SubSection>

					<SubSection title="Associations">
						<Text size="sm">
							An <Text span fw={600}>association</Text> grants a set of access rights from a UA to a
							target node. Associations define what a group of users <Text span fs="italic">can</Text> do
							on a group of resources.
						</Text>
						<List size="sm" spacing={4}>
							<List.Item>Source must always be a UA.</List.Item>
							<List.Item>Target can be a UA, OA, or O.</List.Item>
							<List.Item>Each association carries a set of access rights drawn from the defined Resource Operations.</List.Item>
						</List>
						<Text size="sm" c="dimmed">
							Associations are visible in the tree as special nodes. Open a node's info panel
							to create, edit, or delete its incoming and outgoing associations.
						</Text>
					</SubSection>

					<SubSection title="Node Actions (Right-Click Menu)">
						<List size="sm" spacing={4}>
							<List.Item><Text span fw={600}>Info</Text> — opens the node info panel showing its assignments and associations.</List.Item>
							<List.Item><Text span fw={600}>View Privileges</Text> — computes the access rights currently available on this node.</List.Item>
							<List.Item><Text span fw={600}>Copy Node Name</Text> — copies the node name to the clipboard.</List.Item>
							<List.Item><Text span fw={600}>Create Node</Text> — creates a valid child node type directly under the right-clicked node.</List.Item>
							<List.Item><Text span fw={600}>Create Prohibition</Text> — opens the prohibition form pre-populated with this node as the subject (U or UA only).</List.Item>
							<List.Item><Text span fw={600}>Delete Node</Text> — permanently removes the node from the graph.</List.Item>
						</List>
					</SubSection>
				</Section>

				<Divider />

				{/* Right Panel */}
				<Section title="Right Panel">
					<Text size="sm">
						The right panel hosts a tab system for managing all policy elements beyond the graph
						structure. The pinned tabs below are always available.
					</Text>

					<SubSection title="Prohibitions">
						<Text size="sm">
							A <Text span fw={600}>prohibition</Text> explicitly denies a subject access rights on a
							set of containers, overriding what associations would otherwise allow.
						</Text>
						<List size="sm" spacing={4}>
							<List.Item><Text span fw={600}>Subject</Text> — a U or UA node that the prohibition applies to.</List.Item>
							<List.Item><Text span fw={600}>Access Rights</Text> — the specific rights being denied.</List.Item>
							<List.Item>
								<Text span fw={600}>Inclusion / Exclusion Sets</Text> — containers where the
								denial is active (inclusion) and containers that are exceptions to it (exclusion).
							</List.Item>
							<List.Item>
								<Text span fw={600}>Conjunctive mode</Text> — when enabled, the denial only
								triggers if the subject is in <Text span fs="italic">all</Text> inclusion containers
								simultaneously; otherwise any single match is sufficient.
							</List.Item>
						</List>
						<Text size="sm" c="dimmed">
							Process prohibitions (tied to a specific running process) are read-only and can only
							be deleted, not edited.
						</Text>
					</SubSection>

					<SubSection title="Obligations">
						<Text size="sm">
							An <Text span fw={600}>obligation</Text> is a reactive policy rule written in PML
							(Policy Machine Language) that executes automatically when a triggering event occurs.
							Each obligation specifies a subject pattern (who triggers it), an operation pattern
							(what they do), and a response block (what happens as a result). Each obligation
							records its author and can be deleted but not edited in place — delete and recreate
							to update.
						</Text>
						<CodeBlock>{`
create obligation "on_user_created"
when any user
performs create_new_user
do(ctx) {
    objName := "welcome " + ctx.args.username
    inboxName := ctx.args.username + " inbox"
    create o objName in [inboxName]
}
						`}</CodeBlock>
						<Text size="xs" c="dimmed">
							Subject patterns: <code>any user</code>, <code>user "name"</code>,{' '}
							<code>user in "ua"</code>, <code>process "id"</code>. Patterns can be combined
							with <code>&amp;&amp;</code>, <code>||</code>, and <code>!</code>.
						</Text>
					</SubSection>

					<SubSection title="Admin Operations">
						<Text size="sm">
							Operations that administer the policy graph itself. Custom admin operations are
							defined with the <code>adminop</code> keyword and can execute any PML statement.
							Use the <code>check</code> statement to enforce authorization on the caller before
							the operation body runs. You can view any operation's signature, fill in typed
							parameters, and execute it directly from this tab.
						</Text>
						<CodeBlock>{`
adminop create_new_user(string username) {
    check ["assign_to"] on ["users"]

    create U username in ["users"]
    create OA username + " home" in ["user homes"]
    create OA username + " inbox" in ["user inboxes"]
}
						`}</CodeBlock>
					</SubSection>

					<SubSection title="Resource Operations">
						<Text size="sm">
							Operations that act on protected resources, defined with the <code>resourceop</code>{' '}
							keyword. Use <code>@node</code> to annotate parameters that refer to nodes, and{' '}
							<code>@reqcap</code> to declare the access rights required on those nodes before
							the operation is allowed to execute. This tab also exposes the{' '}
							<Text span fw={600}>Set Resource Access Rights</Text> control — the master list of
							permission names that associations and prohibitions draw from.
						</Text>
						<CodeBlock>{`
@reqcap({
    require ["read"] on [filename]
})
resourceop read_file(@node string filename) { }

@reqcap({
    require ["write"] on [filename]
})
resourceop write_file(@node string filename, string content) {
    // operation body
}
						`}</CodeBlock>
					</SubSection>

					<SubSection title="Queries">
						<Text size="sm">
							Read-only operations that compute access control results without modifying state,
							defined with the <code>query</code> keyword. Queries can call built-in query
							operations like <code>getAdjacentAscendants</code> and <code>getNode</code> and
							must declare a return type. Useful for auditing and verifying that the policy
							behaves as intended.
						</Text>
						<CodeBlock>{`
query get_user_parents(string username) []string {
    return getAdjacentAscendants(username)
}

query node_exists_in(string nodeName, string container) bool {
    descendants := getAdjacentDescendants(container)
    return contains(arr=descendants, element=nodeName)
}
						`}</CodeBlock>
					</SubSection>

					<SubSection title="Routines">
						<Text size="sm">
							Named sequences of operations defined with the <code>routine</code> keyword.
							Unlike admin operations, routines do not perform an authorization check on the
							routine itself or its arguments — access checks happen per-statement inside the
							body. Use routines to group multi-step policy changes that must execute together.
						</Text>
						<CodeBlock>{`
routine setup_project(string projectName, string ownerUA) {
    create OA projectName in ["projects"]
    create OA projectName + "/docs" in [projectName]
    create OA projectName + "/src"  in [projectName]
    associate ownerUA to projectName with ["read", "write", "delete"]
}
						`}</CodeBlock>
					</SubSection>

					<SubSection title="Functions">
						<Text size="sm">
							Reusable utility functions defined with the <code>function</code> keyword.
							Functions are limited to basic statements and can only call other functions —
							they cannot call operations or access policy state. Use them to encapsulate
							string formatting, array manipulation, or other pure logic shared across
							operations and obligations.
						</Text>
						<CodeBlock>{`
function formatName(string first, string last) string {
    return first + " " + last
}

function homeOAName(string username) string {
    return username + " home"
}
						`}</CodeBlock>
					</SubSection>
				</Section>

			</Stack>
		</div>
	);
}
