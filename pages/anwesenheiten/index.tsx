import React from 'react';
import Typography from '@mui/material/Typography';
import { NextPageWithLayout } from '../_app';
import { getAuthenticatedPageLayout } from '../../components/layout/get-page-layouts';
import { GetStaticProps } from 'next';
import ResponsiveContainer from '../../components/layout/ResponsiveContainer';
import { List, ListItemButton, ListItemText, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import prisma from '../../lib/prisma';
import { Event as EventDB } from '@prisma/client';
import PageHead from 'components/PageHead';

export type Event = Omit<EventDB, 'start' | 'end' | 'lastSyncAt'> & {
  start: string;
  end: string;
  lastSyncAt: string;
  inPast: boolean;
};

export function eventFromDBEvent(e: EventDB): Event {
  const now = new Date();
  return {
    ...e,
    start: e.start.toLocaleString('de-AT'),
    end: e.end.toLocaleString('de-AT'),
    lastSyncAt: e.lastSyncAt.toLocaleString('de-AT'),
    inPast: e.end.getTime() < now.getTime(),
  };
}

export const getStaticProps: GetStaticProps = async () => {
  const events = (await prisma.event.findMany())
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .map(e => eventFromDBEvent(e));

  const pastEvents = events.filter(e => e.inPast);
  const currentEvent = events.filter(e => !e.inPast).at(-1) ?? null;

  return {
    props: { pastEvents, currentEvent },
    revalidate: 10, // enables Incremental Static Site Generation; will trigger update of served static page content if more than 10 seconds passed since last request by some client
  };
};

type Props = { pastEvents: Event[]; currentEvent: Event };

const AttendanceEventOverview: NextPageWithLayout<Props> = ({
  currentEvent,
  pastEvents,
}: Props) => {
  const router = useRouter();

  const getResponsiveEventList = (events: Event[], title: string) => (
    <ResponsiveContainer title={title}>
      {events.length > 0 ? (
        <List>
          {events.map((event, i) => (
            <ListItemButton
              key={i}
              onClick={() => router.push(`anwesenheiten/${event.id}`)}
            >
              <ListItemText
                primary={`${event.summary}, ${event.start}`}
                secondary={`${event.location ?? ''}`}
              />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Typography px={2} py={1}>
          Keine Termine gefunden.
        </Typography>
      )}
    </ResponsiveContainer>
  );

  return (
    <>
      <PageHead title="Anwesenheitsliste" />
      <Typography>
        Bitte w??hle zuerst einen Termin, f??r den du Anwesenheiten eintragen
        m??chtest.
      </Typography>
      <Stack spacing={{ md: 2 }}>
        {currentEvent &&
          getResponsiveEventList([currentEvent], 'N??chster Termin')}
        {pastEvents && getResponsiveEventList(pastEvents, 'Vergangene Termine')}
      </Stack>
    </>
  );
};

AttendanceEventOverview.getLayout = getAuthenticatedPageLayout;

export default AttendanceEventOverview;
