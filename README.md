<div align="center">

# CLOVER Website

[![Hosted Here](https://img.shields.io/badge/Website-50B498?style=flat)](https://clover.nickrucinski.com)
[![API Docs](https://img.shields.io/badge/API%20Spec-blue?style=flat)](https://backend-639487598928.us-east5.run.app/apidocs/)
[![Report Issue on Jira](https://img.shields.io/badge/Report%20Issues-Jira-0052CC?style=flat&logo=jira-software)](https://temple-cis-projects-in-cs.atlassian.net/jira/software/c/projects/GCCB/issues)

<!--
[![Deploy Docs](https://github.com/ApplebaumIan/tu-cis-4398-docs-template/actions/workflows/deploy.yml/badge.svg)](https://github.com/Capstone-Projects-2025-Spring/project-copilot-clone-2/actions/workflows/deploy.yml)
-->

[![Documentation Website Link](https://img.shields.io/badge/-Documentation-brightgreen)](https://civic-interactions-lab.github.io/clover/)

</div>

## Abstract

The CLOVER website provides an interface for users to sign in, view their coding activity, manage class enrollment, and access personalized statistics pulled from the Visual Studio Code extension.

It serves as a companion frontend to the [CLOVER API](https://github.com/TUClover/Clover-API), offering a clean and intuitive UI for students and instructors.

## Tech Stack

- **React** frontend framework
- **Vite** build tool
- **Tailwind CSS** for styling
- **ShadCN** for components
- **Supabase** authentication and database

## Getting Started

### Install Node

Installation instructions for NodeJS can be found [here](https://nodejs.org/en/download)

### Install Dependencies

From the root directory of the project run to install the dependencies

```bash
npm install
```

### Run Dev Server

To run the development server use

```bash
npm run dev
```

### Building the Dockfile
docker build \ 
  --build-arg SUPABASE_URL=<SupabaseURL> \
  --build-arg SUPABASE_KEY= <SupabaseAnonKey> \
  --build-arg BASE_URL=<API URL> -t clover-website:latest .


### Environment Variables

See [.env.example](./.env.example) for where to get all the variables you will need. Mainly a Supabase project and a Google Gemini API key.

## Contributing

We welcome contributions! Please open issues, submit pull requests, or reach out with suggestions.

1. Fork the repo
2. Create your branch (`git checkout -b feature/thing`)
3. Commit your changes (`git commit -am 'Add thing'`)
4. Push to the branch (`git push origin feature/thing`)
5. Open a pull request

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE.md) for details.

## Collaborators

[//]: # " readme: collaborators -start "

<table>
<tr>
    <td align="center">
        <a href="https://github.com/jaimenguyen168">
            <img src="https://avatars.githubusercontent.com/u/77992599?v=4" width="100;" alt="Jamie"/>
            <br />
            <sub><b>Jaime</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/AntonioMongeluzi">
            <img src="https://avatars.githubusercontent.com/u/93612712?v=4" width="100;" alt="Antonio"/>
            <br />
            <sub><b>Antonio</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/sophiem18">
            <img src="https://avatars.githubusercontent.com/u/125143591?v=4" width="100;" alt="Sophie"/>
            <br />
            <sub><b>Sophie</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/NicholasRucinski">
            <img src="https://avatars.githubusercontent.com/u/48574032?v=4" width="100;" alt="Nick"/>
            <br />
            <sub><b>Nick</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/tus40499">
            <img src="https://avatars.githubusercontent.com/u/157192065?v=4" width="100;" alt="Jack"/>
            <br />
            <sub><b>Jack</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/ApplebaumIan">
            <img src="https://avatars.githubusercontent.com/u/9451941?v=4" width="100;" alt="ApplebaumIan"/>
            <br />
            <sub><b>Ian Tyler Applebaum</b></sub>
        </a>
    </td>
</tr>
</table>

[//]: # " readme: collaborators -end "
