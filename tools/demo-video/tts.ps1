# Renders narration.json to one WAV per segment with a Windows OneCore voice.
# Usage (Windows PowerShell 5.1): powershell -File tts.ps1 [-Voice Mark] [-Rate 1.0]
param(
  [string]$Voice = "Mark",
  [double]$Rate = 1.0,
  [string]$OutDir = "$PSScriptRoot\out\audio"
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]

# Await a WinRT IAsyncOperation<T> from PowerShell.
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq "AsTask" -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
} | Select-Object -First 1
function Await($op, [Type]$resultType) {
  $task = $asTask.MakeGenericMethod($resultType).Invoke($null, @($op))
  $task.Wait() | Out-Null
  $task.Result
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$match = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like "*$Voice*" } | Select-Object -First 1
if (-not $match) { throw "Voice '$Voice' not found" }
$synth.Voice = $match
$synth.Options.SpeakingRate = $Rate
# A short breath between sentences sounds more like a narrator.
$synth.Options.AppendedSilence = [Windows.Media.SpeechSynthesis.SpeechAppendedSilence]::Default
$synth.Options.PunctuationSilence = [Windows.Media.SpeechSynthesis.SpeechPunctuationSilence]::Default

New-Item -ItemType Directory -Force $OutDir | Out-Null
$segments = Get-Content "$PSScriptRoot\narration.json" -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($s in $segments) {
  $stream = Await ($synth.SynthesizeTextToStreamAsync($s.text)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $path = Join-Path $OutDir "$($s.id).wav"
  $in = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($stream.GetInputStreamAt(0))
  $out = [System.IO.File]::Create($path)
  $in.CopyTo($out)
  $out.Close(); $in.Close()
  # WAV duration = data bytes / byte rate (header bytes 28..31).
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $byteRate = [BitConverter]::ToInt32($bytes, 28)
  $seconds = ($bytes.Length - 44) / $byteRate
  "{0} {1:N2}s" -f $s.id, $seconds
}
"voice: " + $match.DisplayName
