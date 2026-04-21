#!/usr/bin/env python3
"""
Persistent location simulation daemon for LocationSpoofer360.

Opens ONE DTX connection to the iOS device via pymobiledevice3 and keeps it
alive. Reads commands from stdin, sends location updates over the persistent
connection. No process spawning per update = no zombies, no snap-back.

stdin protocol (one command per line):
    <lat>,<lng>      Set location to lat,lng
    clear            Clear simulated location
    (EOF or SIGTERM) Cleanly close the connection

stdout protocol:
    ready            Printed once the DTX connection is established
    ok               Printed after each successful command
    err:<message>    Printed on error (command is NOT fatal)

Usage:
    sim_location_daemon.py <udid>
"""
import asyncio
import sys

from pymobiledevice3.exceptions import NoDeviceConnectedError
from pymobiledevice3.services.dvt.instruments.dvt_provider import DvtProvider
from pymobiledevice3.services.dvt.instruments.location_simulation import LocationSimulation
from pymobiledevice3.tunneld.api import TUNNELD_DEFAULT_ADDRESS, get_tunneld_devices


def _emit(line: str) -> None:
    print(line, flush=True)


async def _read_stdin() -> asyncio.StreamReader:
    """Attach an asyncio StreamReader to stdin."""
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)
    return reader


async def _find_device(udid: str):
    rsds = await get_tunneld_devices(TUNNELD_DEFAULT_ADDRESS)
    if not rsds:
        raise NoDeviceConnectedError()

    device = next((rsd for rsd in rsds if rsd.udid == udid), None)
    if device is None:
        # Close every RSD we opened
        for rsd in rsds:
            await rsd.close()
        raise NoDeviceConnectedError(f"device {udid} not found via tunneld")

    # Close every RSD except ours
    for rsd in rsds:
        if rsd is not device:
            await rsd.close()

    return device


async def main() -> int:
    if len(sys.argv) < 2:
        print("usage: sim_location_daemon.py <udid>", file=sys.stderr)
        return 1

    udid = sys.argv[1]

    try:
        device = await _find_device(udid)
    except Exception as err:
        print(f"err:connect:{err}", flush=True)
        return 2

    try:
        async with DvtProvider(device) as dvt, LocationSimulation(dvt) as loc:
            _emit("ready")
            reader = await _read_stdin()

            while True:
                line_bytes = await reader.readline()
                if not line_bytes:
                    # stdin closed -> clean shutdown
                    break

                line = line_bytes.decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    if line == "clear":
                        await loc.clear()
                        _emit("ok")
                        continue

                    lat_str, lng_str = line.split(",", 1)
                    await loc.set(float(lat_str), float(lng_str))
                    _emit("ok")
                except Exception as err:
                    _emit(f"err:{err}")
    finally:
        try:
            await device.close()
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except KeyboardInterrupt:
        sys.exit(0)
