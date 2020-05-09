import React from 'react';
import _ from 'lodash';

import { AppObjectList } from '../appobj/AppObjectList';
import connectionAppObject from '../appobj/connectionAppObject';
import databaseAppObject from '../appobj/databaseAppObject';
import { useSetCurrentDatabase, useCurrentDatabase, useOpenedConnections } from '../utility/globalState';
import InlineButton from './InlineButton';
import databaseObjectAppObject from '../appobj/databaseObjectAppObject';
import {
  useSqlObjectList,
  useDatabaseList,
  useConnectionList,
  useServerStatus,
  useDatabaseStatus,
} from '../utility/metadataLoaders';
import {
  SearchBoxWrapper,
  WidgetsInnerContainer,
  Input,
  WidgetsMainContainer,
  WidgetsOuterContainer,
  WidgetTitle,
} from './WidgetStyles';
import axios from '../utility/axios';
import LoadingInfo from './LoadingInfo';

function SubDatabaseList({ data }) {
  const setDb = useSetCurrentDatabase();
  const handleDatabaseClick = (database) => {
    setDb({
      ...database,
      connection: data,
    });
  };
  const { _id } = data;
  const databases = useDatabaseList({ conid: _id });
  return (
    <AppObjectList
      list={(databases || []).map((db) => ({ ...db, connection: data }))}
      makeAppObj={databaseAppObject({ boldCurrentDatabase: true })}
      onObjectClick={handleDatabaseClick}
    />
  );
}

function ConnectionList() {
  const connections = useConnectionList();
  const serverStatus = useServerStatus();
  const openedConnections = useOpenedConnections();
  const connectionsWithStatus =
    connections && serverStatus
      ? connections.map((conn) => ({ ...conn, status: serverStatus[conn._id] }))
      : connections;

  const handleRefreshConnections = () => {
    for (const conid of openedConnections) {
      axios.post('server-connections/refresh', { conid });
    }
  };

  const [filter, setFilter] = React.useState('');
  return (
    <>
      <WidgetTitle>Connections</WidgetTitle>
      <SearchBoxWrapper>
        <Input type="text" placeholder="Search connection" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <InlineButton onClick={handleRefreshConnections}>Refresh</InlineButton>
      </SearchBoxWrapper>

      <WidgetsInnerContainer>
        <AppObjectList
          list={connectionsWithStatus}
          makeAppObj={connectionAppObject({ boldCurrentDatabase: true })}
          SubItems={SubDatabaseList}
          filter={filter}
        />
      </WidgetsInnerContainer>
    </>
  );
}

function SqlObjectList({ conid, database }) {
  const objects = useSqlObjectList({ conid, database });
  const status = useDatabaseStatus({ conid, database });

  const handleRefreshDatabase = () => {
    axios.post('database-connections/refresh', { conid, database });
  };

  const [filter, setFilter] = React.useState('');
  const objectList = _.flatten(
    ['tables', 'views', 'procedures', 'functions'].map((objectTypeField) =>
      ((objects || {})[objectTypeField] || []).map((obj) => ({ ...obj, objectTypeField }))
    )
  );
  return (
    <>
      <WidgetTitle>Tables, views, functions</WidgetTitle>
      <SearchBoxWrapper>
        <Input
          type="text"
          placeholder="Search tables or objects"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <InlineButton onClick={handleRefreshDatabase}>Refresh</InlineButton>
      </SearchBoxWrapper>
      <WidgetsInnerContainer>
        {status && status.name == 'pending' ? (
          <LoadingInfo message="Loading database structure" />
        ) : (
          <AppObjectList
            list={objectList.map((x) => ({ ...x, conid, database }))}
            makeAppObj={databaseObjectAppObject()}
            groupFunc={(appobj) => appobj.groupTitle}
            filter={filter}
          />
        )}
      </WidgetsInnerContainer>
    </>
  );
}

function SqlObjectListWrapper() {
  const db = useCurrentDatabase();

  if (!db) return <div>(Choose database)</div>;
  const { name, connection } = db;

  return <SqlObjectList conid={connection._id} database={name} />;
  // return <div>tables of {db && db.name}</div>
  // return <div>tables of {JSON.stringify(db)}</div>
}

export default function DatabaseWidget() {
  return (
    <WidgetsMainContainer>
      <WidgetsOuterContainer>
        <ConnectionList />
      </WidgetsOuterContainer>
      <WidgetsOuterContainer>
        <SqlObjectListWrapper />
      </WidgetsOuterContainer>
    </WidgetsMainContainer>
  );
}
