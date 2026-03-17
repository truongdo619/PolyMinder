import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink
} from "../../components/DocComponents";

export const toc = [
  { id: "backend", title: "Backend", level: 2 },
  { id: "frontend", title: "Frontend", level: 2 },
  { id: "license", title: "License", level: 2 },
];

export const searchContent = `
# Installation
In addition to the [PolyMinder online platform](https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder), we also provide the open-source code so users can install and run the system locally. The source code includes both the Frontend and Backend components. Please follow the instructions below to set them up. 

## Backend

For detailed information on setting up and running the backend, please refer to the [backend README](https://github.com/truongdo619/PolyMinder/blob/main/backend/README.md).

## Frontend

For detailed information on setting up and running the frontend, please refer to the [webinterface README](https://github.com/truongdo619/PolyMinder/blob/main/webinterface/README.md).


## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/truongdo619/PolyMinder/blob/main/LICENSE) file for details.
`;


export default function Installation() {
  return (
    <Box>
      <DocHeader level={1} id="installation">Installation</DocHeader>
      <DocText>In addition to the <DocLink href="https://www.jaist.ac.jp/is/labs/nguyen-lab/systems/polyminder">PolyMinder online platform</DocLink>, we also provide the open-source code so users can install and run the system locally. The source code includes both the Frontend and Backend components. Please follow the instructions below to set them up.</DocText>
      <DocHeader level={2} id="backend">Backend</DocHeader>
      <DocText>For detailed information on setting up and running the backend, please refer to the <DocLink href="https://github.com/truongdo619/PolyMinder/blob/main/backend/README.md">backend README</DocLink>.</DocText>
      <DocHeader level={2} id="frontend">Frontend</DocHeader>
      <DocText>For detailed information on setting up and running the frontend, please refer to the <DocLink href="https://github.com/truongdo619/PolyMinder/blob/main/webinterface/README.md">webinterface README</DocLink>.</DocText>
      <DocHeader level={2} id="license">License</DocHeader>
      <DocText>This project is licensed under the MIT License - see the <DocLink href="https://github.com/truongdo619/PolyMinder/blob/main/LICENSE">LICENSE</DocLink> file for details.</DocText>
    </Box>
  );
}
