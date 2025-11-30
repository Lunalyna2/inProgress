import { useParams } from "react-router-dom";
import JoinedProjectFolder from "./JoinedProjectFolder";
import { useAuth } from "./AuthContext";

const JoinedProjectFolderWrapper: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  if (!projectId) return <div>Invalid project</div>;
  if (!user) return <div>Please login to view this project</div>;

  return (
    <JoinedProjectFolder
      projectId={parseInt(projectId, 10)}
      currentUser={user}
    />
  );
};

export default JoinedProjectFolderWrapper;
