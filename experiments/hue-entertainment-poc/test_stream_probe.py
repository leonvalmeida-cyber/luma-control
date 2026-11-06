"""Pure offline tests for the Luma Entertainment probe; no Hue bridge or network calls."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest
import argparse


SOURCE = Path(__file__).parent / "stream_probe.py"
spec = importlib.util.spec_from_file_location("luma_hue_stream_probe", SOURCE)
probe = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = probe
spec.loader.exec_module(probe)


class ColorPlanTests(unittest.TestCase):
    def test_initial_color(self):
        self.assertEqual(probe.color_at(0.0), probe.WARM)
        self.assertEqual(probe.color_at(2.99), probe.WARM)

    def test_first_transition_starts_smoothly(self):
        self.assertEqual(probe.color_at(3.0), probe.WARM)
        self.assertEqual(probe.color_at(3.4), probe.TEAL)

    def test_second_transition_starts_from_previous(self):
        self.assertEqual(probe.color_at(6.0), probe.TEAL)
        self.assertEqual(probe.color_at(6.4), probe.VIOLET)

    def test_bounded_color_components(self):
        for i in range(1000):
            c = probe.color_at(i / 100)
            for value in (c.red, c.green, c.blue):
                self.assertGreaterEqual(value, 0)
                self.assertLessEqual(value, 65535)

    def test_clip_interpolation(self):
        self.assertEqual(probe.interpolate(probe.WARM, probe.TEAL, -1), probe.WARM)
        self.assertEqual(probe.interpolate(probe.WARM, probe.TEAL, 2), probe.TEAL)


class AddressTests(unittest.TestCase):
    def test_private_ips(self):
        for address in ("192.168.178.177", "10.0.0.1", "172.20.0.7"):
            self.assertEqual(probe.private_bridge_ip(address), address)

    def test_reject_public_and_local(self):
        for address in ("8.8.8.8", "127.0.0.1", "169.254.1.1", "not an IP", "::1"):
            with self.assertRaises(argparse.ArgumentTypeError):
                probe.private_bridge_ip(address)


if __name__ == "__main__":
    unittest.main()
