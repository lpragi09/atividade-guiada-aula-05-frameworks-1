// src/components/Header.jsx
import React from "react";
import styled from "styled-components";
import { Box, Typography, IconButton, Tooltip, Chip, Stack } from "@mui/material";
import { DarkMode, LightMode, Explore, Bookmarks, LocationCity } from "@mui/icons-material";

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Logo = styled.div`
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.palette.primary.main},
    ${({ theme }) => theme.palette.secondary.main}
  );
  box-shadow: 0 12px 30px
    ${({ theme }) => (theme.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(59, 91, 219, 0.35)")};
`;

const Title = styled(Typography)`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.palette.text.primary},
    ${({ theme }) => theme.palette.primary.main}
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.1;
`;

const Header = ({ mode, onToggleMode, favoritesCount, citiesCount }) => {
  const isDark = mode === "dark";

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        mb: 4,
      }}
    >
      <Brand>
        <Logo>
          <Explore sx={{ fontSize: 30 }} />
        </Logo>
        <Box>
          <Title variant="h4" component="h1">
            GeoBusca CEP
          </Title>
          <Typography variant="body2" color="text.secondary">
            Busque um CEP, veja no mapa e guarde seus lugares.
          </Typography>
        </Box>
      </Brand>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Chip
          icon={<Bookmarks />}
          label={`${favoritesCount} ${favoritesCount === 1 ? "favorito" : "favoritos"}`}
          variant="outlined"
          size="small"
        />
        {citiesCount > 0 && (
          <Chip
            icon={<LocationCity />}
            label={`${citiesCount} ${citiesCount === 1 ? "cidade" : "cidades"}`}
            variant="outlined"
            size="small"
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          />
        )}
        <Tooltip title={isDark ? "Modo claro" : "Modo escuro"}>
          <IconButton
            onClick={onToggleMode}
            aria-label="Alternar tema"
            sx={{
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default Header;
