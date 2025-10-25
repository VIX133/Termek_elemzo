# Termék Elemző (PDF Feldolgozó)

Ez egy Next.js alkalmazás, amely a Google Gemini API segítségével kinyeri az allergéneket és tápérték adatokat a feltöltött PDF fájlokból.

## Telepítés és futtatás

1.  **Klónozd a repository-t (vagy csomagold ki a .zip-et):**
    ```bash
    git clone [repository-url]
    cd [projekt-mappa]
    ```

2.  **Telepítsd a függőségeket:**
    ```bash
    npm install
    ```

3.  **Környezeti változók beállítása:**
    * Hozz létre egy fájlt `.env.local` néven.
    * Szerkeszd az `.env.local` fájlt, és add meg a saját Google API kulcsodat:
    ```plaintext
    GOOGLE_API_KEY="AIza...YOUR_KEY..."
    ```

4.  **Futtasd a fejlesztői szervert:**
    ```bash
    npm run dev
    ```

5.  **Nyisd meg a böngészőben:**
    Látogass el a `http://localhost:3000` címre.
