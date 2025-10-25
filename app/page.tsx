'use client';

import { useState, useRef } from 'react';
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, AlertCircle, Download } from 'lucide-react';

interface TapertJellemzok {
  energia: string | null;
  zsir: string | null;
  szenhidrat: string | null;
  cukor: string | null;
  feherje: string | null;
  natrium_vagy_so: string | null;
}

interface ApiResult {
  allergenek: string[];
  tapert_jellemzok: TapertJellemzok;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Kérlek, válassz egy PDF fájlt!');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Hiba a feldolgozás során a szerveren.');
      }

      // Klónozzuk a választ, mielőtt feldolgoznánk
      const responseClone = response.clone();
      
      // Nyers válasz mentése
      const responseText = await responseClone.text();
      setRawResponse(responseText);
      
      // Eredmények feldolgozása
      const data: ApiResult = await response.json();
      setResult(data);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ismeretlen hiba történt.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadRawJson = () => {
    if (!rawResponse) return;
    
    const blob = new Blob([rawResponse], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raw-response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <FileText className="h-8 w-8" />
              Termék Elemző
            </CardTitle>
            <CardDescription>
              Tölts fel egy termékleírást (PDF), és kinyerjük az allergéneket és tápérték adatokat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Fájl feltöltő mező */}
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {file ? file.name : 'Kattints a PDF fájl feltöltéséhez'}
                    </p>
                  </div>
                </Button>
              </div>

              {/* Küldés gomb */}
              <Button type="submit" disabled={loading || !file} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Feldolgozás...
                  </>
                ) : (
                  'Feldolgozás'
                )}
              </Button>
            </form>

            {/* Hibaüzenet */}
            {error && (
              <Card className="mt-6 border-destructive">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Hiba: {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Eredmények megjelenítése */}
            {result && (
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Eredmények</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Allergének</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.allergenek.length > 0 ? (
                          result.allergenek.map((allergen, index) => (
                            <Badge key={index} variant="secondary">{allergen}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Nem találhatók allergének.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Tápérték jellemzők</h4>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(result.tapert_jellemzok).map(([key, value]) => (
                          <React.Fragment key={key}>
                            <dt className="font-medium text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </dt>
                            <dd>{value || 'N/A'}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </div>
                    
                    {/* Nyers JSON letöltése gomb */}
                    <div className="pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={downloadRawJson}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Nyers JSON letöltése
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}