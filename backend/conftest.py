# ensures the backend package root is importable when pytest runs from any directory
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
