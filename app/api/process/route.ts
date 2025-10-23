import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai"; 
//const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function fileToGenerativePart(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: file.type,
    },
  };
}

const systemPrompt = `
  Feladatod: Élelmiszer termékleírásból adatok kinyerése.
  A bemenet egy PDF fájl, ami tartalmazhat scannelt képeket is.
  A kimenetnek KIZÁRÓLAG egy JSON objektumnak kell lennie, minden más szöveg nélkül.

  Kérlek, nyerd ki a következő adatokat a dokumentumból:

  1. Allergének (pontosan ezeket a neveket használd a listában, ha szerepelnek):
     - Glutén
     - Tojás
     - Rák
     - Hal
     - Földimogyoró
     - Szója
     - Tej
     - Diófélék (pl. mandula, mogyoró, dió)
     - Zeller
     - Mustár
     - Szezámmag
     - Kén-dioxid és szulfitok
     - Csillagfürt (lupin)
     - Puhatestüek (pl. kagyló, osztriga, csiga)

  2. Tápérték jellemzők (ha lehet, 100g-ra vagy 100ml-re vonatkozóan):
     - Energia (kcal és/vagy kJ)
     - Zsír (g)
     - Szénhidrát (g)
     - Cukor (g)
     - Fehérje (g)
     - Nátrium (g vagy mg) (Ha nátrium nincs, de 'Só' van, azt is elfogadjuk)

  A kimeneti JSON formátuma pontosan a következő legyen:
  {
    "allergenek": ["string", ...],
    "tapert_jellemzok": {
      "energia": "string (érték és mértékegység)",
      "zsir": "string (érték és mértékegység)",
      "szenhidrat": "string (érték és mértékegység)",
      "cukor": "string (érték és mértékegység)",
      "feherje": "string (érték és mértékegység)",
      "natrium_vagy_so": "string (érték és mértékegység)"
    }
  }

  Ha egy adat egyértelműen nem található, használj "null" értéket a JSON-ban 
  (pl. "cukor": "null", vagy "allergenek": []).
  Ne adj hozzá a JSON-hoz semmilyen magyarázatot, csak magát a JSON kódot.
`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
   if (!apiKey) {
    console.error("Hiba: A GOOGLE_API_KEY környezeti változó nincs beállítva.");
    return NextResponse.json({ error: 'Szerver konfigurációs hiba: API kulcs hiányzik.' }, { status: 500 });
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const formData = await request.formData();
    const fileValue = formData.get('file');

    if (!fileValue || !(fileValue instanceof File)) {
      return NextResponse.json({ error: 'Nincs fájl feltöltve.' }, { status: 400 });
    }
    
    const file: File = fileValue;

    const filePart = await fileToGenerativePart(file);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      systemPrompt,
      filePart
    ]);

    const response = result.response;
    let aiText = response.text();

    if (aiText.startsWith('```json')) {
      aiText = aiText.substring(7, aiText.length - 3).trim();
    } else if (aiText.startsWith('```')) {
       aiText = aiText.substring(3, aiText.length - 3).trim();
    }

    const jsonData = JSON.parse(aiText);

    return NextResponse.json(jsonData, { status: 200 });

  } catch (error) {
    console.error('Hiba az AI feldolgozás során:', error);
    const errorMessage = (error instanceof Error) ? error.message : 'Ismeretlen szerverhiba.';
    return NextResponse.json({ error: `Hiba történt az AI feldolgozás során: ${errorMessage}` }, { status: 500 });
  }
}