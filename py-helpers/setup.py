from setuptools import setup,find_packages
import re

with open('requirements.txt') as f:
    requirements = f.read().splitlines()

with open('prepare_code/__init__.py') as f:
    version = re.search("__version__ = '(.+)'", f.read()).group(1)

with open('README.md', encoding='utf-8') as f:
    readme = f.read()

setup(
    name='prepare_code',
    author='M.Karkowski',
    python_requires='>=3.6.0',
    version=version,
    packages=['prepare_code'],
    license='MIT',
    description='A simple TypeScript to Python transpiler. Helps the user to simplify the code.',
    long_description=readme,
    long_description_content_type='text/markdown',
    include_package_data=True,
    install_requires=requirements,
    classifiers=[],
    entry_points={
        'console_scripts': [
            'nope-py-prepare-code = prepare_code.main:main',
        ],
    }
)