import React, { useRef } from 'react';
import Grid from '@material-ui/core/Grid';
import { Card, CardContent, Typography, Button } from '@material-ui/core';

interface GreetingCardProps {
  fileInputChanged: (files: FileList) => void;
}

const GreetingCard = ({ fileInputChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>();

  return (
    <Grid item xs={6}>
      <Card>
        <CardContent>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            MONZO Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            1.Open your Monzo app and export an "All time" bank statement in CSV
            (Comma Separated Values) format <br />
            2. Send it to yourself Load the CSV file here. (Your file is staying
            in the browser, it will not be uploaded anywhere)
          </Typography>
          <Button
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
              onChange={e => fileInputChanged(e.target.files?.item(0))}
            />
          </div>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default GreetingCard;
