import React, { useRef } from 'react';
import Grid from '@material-ui/core/Grid';
import { Card, CardContent, Typography, Button } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';

interface GreetingCardProps {
  fileInputChanged: (files: FileList) => void;
}

const GreetingCard = ({ fileInputChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>();

  return (
    <Grid item xs={7}>
      <Card className="info-card">
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            MONZO Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            This is an unoffical hobby project to show detailed, filterable
            analytics of your monzo purchase history. This app is a frontend
            only app, and is 100% secure. (the csv file stays on your computer
            and is NOT getting uploaded anywhere).
          </Typography>
          <Divider className="divider" />
          <Typography variant="body1" color="textSecondary" gutterBottom>
            1.Open your Monzo app and export an "All time" bank statement in CSV
            (Comma Separated Values) format <br />
            2. Send it to yourself and load the CSV file here. (Your file is
            staying in the browser, it will not be uploaded anywhere)
          </Typography>
          <Button
            className="loadbutton"
            variant="contained"
            color="primary"
            onClick={() => fileInputRef.current.click()}
          >
            Load CSV file
          </Button>
          <div hidden className="file-import-button">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => fileInputChanged(e.target.files?.item(0))}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            Preview
          </Typography>
          <video
            autoPlay
            muted
            loop
            className="video"
            controls
            src="./monzo_demo.mp4"
          ></video>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default GreetingCard;
