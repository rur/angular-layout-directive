require 'yaml'
include FileUtils

content = File.open('layoutFiles.js', 'r') {|f| f.read }
files = eval(content.gsub(/\};(\s|\S)*/, '}').
            gsub(/angularFiles = /, '').
            gsub(/:/, '=>').
            gsub(/\/\//, '#'));

BUILD_DIR = 'build'

task :default => [:compile, :test]


desc 'Init the build workspace'
task :init do
  FileUtils.mkdir(BUILD_DIR) unless File.directory?(BUILD_DIR)
end


desc 'Clean Generated Files'
task :clean do
  FileUtils.rm_r(BUILD_DIR, :force => true)
  FileUtils.mkdir(BUILD_DIR)
end

desc 'Compile JavaScript'
task :compile => [:init] do

  concat_file('flLayout.js', [
        'src/layout.prefix',
        files['layoutSrc'],
        'src/layout.suffix',
      ], gen_css('css/layout.css', true))
      
  closure_compile('flLayout.js')

end



###################
# utility methods #
###################


##
# generates css snippet from a given files and optionally applies simple minification rules
#
def gen_css(cssFile, minify = false)
  css = ''
  File.open(cssFile, 'r') do |f|
    css = f.read
  end

  if minify
    css.gsub! /\n/, ''
    css.gsub! /\/\*.*?\*\//, ''
    css.gsub! /:\s+/, ':'
    css.gsub! /\s*\{\s*/, '{'
    css.gsub! /\s*\}\s*/, '}'
    css.gsub! /\s*\,\s*/, ','
    css.gsub! /\s*\;\s*/, ';'
  end

  #escape for js
  css.gsub! /\\/, "\\\\\\"
  css.gsub! /'/, "\\\\'"
  css.gsub! /\n/, "\\n"

  return %Q{angular.element(document).find('head').append('<style type="text/css">#{css}</style>');}
end


##
# returns path to the file in the build directory
#
def path_to(filename)
  return File.join(BUILD_DIR, *filename)
end


def closure_compile(filename)
  puts "Compiling #{filename} ..."

  min_path = path_to(filename.gsub(/\.js$/, '.min.js'))

  %x(java -jar lib/closure-compiler/compiler.jar \
        --compilation_level SIMPLE_OPTIMIZATIONS \
        --language_in ECMASCRIPT5_STRICT \
        --js #{path_to(filename)} \
        --js_output_file #{min_path})

  rewrite_file(min_path) do |content|
    content.sub!("'use strict';", "").
            sub!(/\(function\([^)]*\)\{/, "\\0'use strict';")
  end
end


def concat_file(filename, deps, footer='')
  puts "Building #{filename} ..."
  File.open(path_to(filename), 'w') do |f|
    concat = 'cat ' + deps.flatten.join(' ')
    puts "command = #{concat}"
    content = %x{#{concat}}.
              gsub(/^\s*['"]use strict['"];?\s*$/, ''). # remove all file-specific strict mode flags
              sub(/\(function\([^)]*\)\s*\{/, "\\0\n'use strict';") # add single strict mode flag

    f.write(content)
    f.write(footer)
  end
end


def rewrite_file(filename)
  File.open(filename, File::RDWR) do |f|
    content = f.read

    content = yield content

    raise "File rewrite failed - No content!" unless content

    f.truncate 0
    f.rewind
    f.write content
  end
end
