name: Puntual Outreach Diario

on:
  schedule:
    # Corre todos los días a las 9:00 AM Argentina (UTC-3 = 12:00 UTC)
    - cron: "0 12 * * 1-5"  # Lunes a viernes
  workflow_dispatch:  # También permite correrlo manualmente desde GitHub

jobs:
  outreach:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Instalar dependencias
        run: |
          cd outreach
          npm install

      - name: Buscar emails nuevos
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
        run: |
          cd outreach
          node outreach.js buscar

      - name: Enviar emails personalizados
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
        run: |
          cd outreach
          node outreach.js enviar

      - name: Guardar base de datos actualizada
        uses: actions/upload-artifact@v4
        with:
          name: colegios-db
          path: outreach/colegios.json
          retention-days: 30

      - name: Commit estado actualizado
        run: |
          git config --global user.name "Puntual Bot"
          git config --global user.email "bot@puntual.app"
          git add outreach/colegios.json
          git diff --staged --quiet || git commit -m "chore: actualizar estado outreach $(date +'%Y-%m-%d')"
          git push
