import {AppShell, Button, Group, Title, useMantineTheme} from "@mantine/core";
import {PMIcon} from "@/components/icons/PMIcon";
import {UserMenu} from "@/features/user-menu/UserMenu";
import React from "react";
import {Dashboard} from "@/pages/dashboard/Dashboard";
import { Link } from "react-router-dom";
import { IconCode } from "@tabler/icons-react";

export function DashboardPage() {
	const mantineTheme = useMantineTheme();

	return (
		<AppShell
			header={{ height: 40 }}
			transitionDuration={0}
			style={{ height: '100vh', overflow: 'hidden' }}
		>
			<AppShell.Header style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
				<Group h="100%" px="md" justify="space-between">
					<Group>
						<PMIcon style={{width: '32px', height: '32px'}}/>
						<Title order={3}>Policy Machine</Title>
					</Group>
					<Group>
						<UserMenu />
					</Group>
				</Group>
			</AppShell.Header>
			<AppShell.Main style={{
				backgroundColor: mantineTheme.other.intellijContentBg,
				display: 'flex',
				flexDirection: 'column',
				height: '100vh'
			}}>
				<div style={{ flex: 1, minHeight: 0 }}>
					<Dashboard />
				</div>
			</AppShell.Main>
		</AppShell>
	);
}