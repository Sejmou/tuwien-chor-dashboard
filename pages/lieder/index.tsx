import { useState } from 'react';
import Typography from '@mui/material/Typography';
import { NextPageWithLayout } from 'pages/_app';
import { getAdminPageLayout } from 'components/layout/get-page-layouts';
import AdminPageHead from 'components/layout/AdminPageHead';
import { api } from 'utils/api';
import {
  Button,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from '@mui/material';
import { Song, SongFileLink } from 'drizzle/models';
import { AttachFile } from '@mui/icons-material';
import SongFileLinksDialog from 'components/admin/SongFileLinksDialog';
import CustomDropzone from 'components/CustomDropzone';
import BasicDialog from 'components/BasicDialog';
import { singularPluralAutoFormat } from 'frontend-utils';

const Songs: NextPageWithLayout = () => {
  const songQ = api.song.getAll.useQuery();
  const updateSongFileLinks = api.song.updateFileLinks.useMutation();

  const songs = songQ?.data?.songs ?? [];

  const [fileEditDialogOpen, setDialogOpen] = useState(false);
  const [song, setSong] = useState<(typeof songs)[0] | null>(null);

  const handleFileLinksSave = async (links: SongFileLink[], songId: string) => {
    console.log(links);
    const update = await updateSongFileLinks.mutateAsync({
      links,
      songId,
    });
    const song = songs?.find(s => s.id === update.songId);
    if (song) {
      song.fileLinks = update.fileLinks;
    } else {
      console.warn('Song not found, cannot update files received from server');
    }
    setDialogOpen(false);
  };

  const handleFileEditClick = (song: (typeof songs)[0]) => {
    setSong(song);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const songListItems = songs?.map(song => (
    <ListItem key={song.id}>
      <ListItemText
        primary={song.name}
        secondary={song.createdAt.toLocaleDateString()}
      />
      <ListItemSecondaryAction>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AttachFile />}
          onClick={() => handleFileEditClick(song)}
        >
          {singularPluralAutoFormat(song.fileLinks, 'File')} verlinkt
        </Button>
      </ListItemSecondaryAction>
    </ListItem>
  ));

  return (
    <>
      <AdminPageHead title="Lieder" />
      {songListItems ? (
        <>
          {songListItems.length === 0 && (
            <Typography variant="body1">
              Es sind noch keine Lieder in der Datenbank.
            </Typography>
          )}
          <List>{songListItems}</List>
        </>
      ) : (
        <Typography variant="body1">Lade Lieder...</Typography>
      )}
      <SongsImport
        onImport={songs => {
          // just refetch data instead of trying to merge
          songQ.refetch();
        }}
      />
      {song && (
        <SongFileLinksDialog
          open={fileEditDialogOpen}
          key={song.id} // force re=render if song changes
          links={song.fileLinks}
          songId={song.id}
          songName={song.name}
          onSave={files => handleFileLinksSave(files, song.id)}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
};

type SongImportProps = {
  onImport: (songs: Song[]) => void;
};

const SongsImport = ({ onImport }: SongImportProps) => {
  const addSongs = api.song.add.useMutation();
  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [failures, setFailures] = useState<string[]>([]);

  const handleFilesAdded = async (files: File[]) => {
    const firstFile = files[0];
    if (!firstFile) return;
    const text = await readFileTextContent(firstFile);
    console.log(text);
    const songNames = text.split('\n').map(s => s.trim());
    const uniqueSongNames = [...new Set(songNames)];
    setImportedNames(uniqueSongNames);
  };

  return (
    <>
      <CustomDropzone
        text={'Neue Lieder importieren (Textdatei 1 Namen pro Zeile)'}
        onFilesAdded={handleFilesAdded}
        fileTypesAndExtensions={{
          'text/plain': ['.txt'],
          'text/csv': ['.csv'],
        }}
      />
      {importedNames.length > 0 && (
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          color="primary"
          onClick={async () => {
            const { createdSongs, failures } = await addSongs.mutateAsync(
              importedNames
            );
            setFailures(failures);
            onImport(createdSongs);
            setImportedNames([]);
          }}
        >
          {importedNames.length} Lieder importieren
        </Button>
      )}
      <BasicDialog
        open={failures.length > 0}
        onClose={() => setFailures([])}
        title="Fehler beim Importieren"
      >
        <Typography variant="body1">
          Einige Lieder konnten nicht importiert werden:
        </Typography>
        <List>
          {failures.map(failure => (
            <ListItem key={failure}>
              <ListItemText primary={failure} />
            </ListItem>
          ))}
        </List>
        <Typography>
          Wahrscheinlich existieren die Lieder schon. Wenn nicht, bitte an den
          Admin wenden.
        </Typography>
      </BasicDialog>
    </>
  );
};

async function readFileTextContent(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result;
      resolve(text as string);
    };

    reader.onerror = error => {
      reject(error);
    };

    reader.readAsText(file);
  });
}

Songs.getLayout = getAdminPageLayout;

export default Songs;
